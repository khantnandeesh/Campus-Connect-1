import React from 'react';
import { useParams } from 'react-router-dom';
import UserSearch from '../components/UserSearch';

const FindUsers = () => {
    const { userId } = useParams();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Find Users to Chat With</h1>
            <UserSearch currentUserId={userId} />
        </div>
    );
};

export default FindUsers; 