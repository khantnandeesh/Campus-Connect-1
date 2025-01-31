import StudyRoom from "../models/room.model";

export const createRoom = async (req,res) => {
    const { roomId, host } = req.body;

    try {
        let existingRoom = await StudyRoom.findOne({ roomId });
        if(existingRoom){
            return res.status(400).json({ message: 'Room already exists' });
        }

        const newRoom = new studyRoomSchema({ roomId, 
                                                host , 
                                                participants: [{ 
                                                    userId: host, 
                                                    username: req.user.username 
                                                }]
                                            });
        await newRoom.save();

        res.status(201).json(newRoom);
        
    } catch (error) {
        res.status(500).json({ message: 'Error creating room', error });
    }
};

export const getRoom = async (req,res) => {
    const { roomId } = req.body;

    try {
        const room = await StudyRoom.findOne({ roomId });
        if(!room){
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room', error });
    }
}

export const joinRoom = async (req,res) => {
    const { roomId, userId, username } = req.body;

    try {
        let room = await StudyRoom.findOne({ roomId });
        if(!room){
            return res.status(404).json({ message: 'Room not found' });
        }

        const alreadyInRoom = room.participants.find(participant => participant.userId === userId);
        if (!alreadyInRoom) {
            room.participants.push({ userId, username });
            await room.save();
        }

        res.status(200).json(room);

    } catch (error) {
        res.status(500).json({ message: 'Error joining room', error });
    }
};


export const leaveRoom = async (req,res) => {
    const {roomId, userId} = req.body;

    try {
        const room = await StudyRoom.findOne({ roomId });
        if(!room){
            return res.status(404).json({ message: 'Room not found' });
        }

        room.participants = room.participants.filter(participant => participant.userId !== userId);
        await room.save();

        if(room.participants.length === 0){
            await room.remove();
            console.log('Room removed');
            res.status(200).json({ message: 'Left room and room removed' });
        }

        res.status(200).json({ message: 'Left room', room });
    } catch (error) {
        res.status(500).json({ message: 'Error leaving room', error });
    }
};

export const updateTimer = async (req,res) => {
    const { isRunning, timer , roomId } = req.body;

    try {
        const room = await StudyRoom.findOne({ roomId });
        if(!room){
            return res.status(404).json({ message: 'Room not found' });
        }

        room.isRunning = isRunning;
        room.timer = timer;
        
        res.status(200).json({ message: 'Timer updated', room });
    } catch (error) {
        res.status(500).json({ message: 'Error updating timer', error });
    }
};

export const sendMessage = async (req,res) => {
    const { roomId, sender, message } = req.body;

    try {
        const room = await StudyRoom.findOne({ roomId });
        if(!room){
            return res.status(404).json({ message: 'Room not found' });
        }

        room.chatMessages.push({ sender, message });
        await room.save();

        res.status(200).json({ message: 'Message sent', chatMessages: room.chatMessages });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error });
    }
};

export const addTask = async (req,res) => {
    const { roomId, title, createdBy } = req.body;

    try {
        const room = await StudyRoom.findOne({ roomId });
        if(!room){
            return res.status(404).json({ message: 'Room not found' });
        }

        room.tasks.push({ title, createdBy });
        await room.save();
        res.status(200).json(room.tasks);
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding task', error });
    }
};

export const updateTask = async (req,res) => {
    const { roomId, taskId } = req.body;

    try {
        const room = await StudyRoom.findOne({ roomId});
        if(!room){
            return res.status(404).json({ message: 'Room not found' });
        }

        const task = room.tasks.id(taskId);
        if(!task){
            return res.status(404).json({ message: 'Task not found' });
        }

        task.completed = !task.completed;
        await room.save();

        res.status(200).json(task);
    } catch (error) { 
        res.status(500).json({ message: 'Error updating task', error });
    }
};

export const deleteTask = async (req,res) => {
    const { roomId, taskId } = req.body;

    try {
        const room = await StudyRoom.findOne({ roomId });
        if(!room){
            return res.status(404).json({ message: 'Room not found' });
        }
        
        room.tasks = room.tasks.filter(task => task._id.toString() !== taskId);
        await room.save();

        res.status(200).json({ message: 'Task deleted', room });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error });
    }
};