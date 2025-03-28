import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import axios from "axios";
import { Tooltip } from "react-tooltip";

const MeetingCalendar = ({ user }) => {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [message, setMessage] = useState("");
  const [copy, setCopy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "http://localhost:3000/api/meetings/all",
          {
            withCredentials: true,
          }
        );
        setMeetings(response.data);
      } catch (error) {
        console.error("Error fetching meetings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const events = meetings.map((meeting) => ({
    id: meeting._id,
    title: meeting.title,
    start: meeting.date,
    backgroundColor: getStatusColor(meeting.status, 0.7),
    borderColor: getStatusColor(meeting.status, 1),
    textColor: "#FFFFFF",
    extendedProps: meeting,
  }));

  function getStatusColor(status, opacity = 1) {
    switch (status) {
      case "accepted":
        return `rgba(76, 175, 80, ${opacity})`;
      case "declined":
        return `rgba(229, 57, 53, ${opacity})`;
      default:
        return `rgba(255, 179, 0, ${opacity})`;
    }
  }

  const handleEventClick = ({ event }) => {
    let meetingData = event.extendedProps;
    let eventDate = new Date(meetingData.date).getDate();
    let now = new Date().getDate();

    if (eventDate === now) {
      let message = new TextEncoder().encode(JSON.stringify(meetingData));
      let data = Buffer.from(message).toString("base64");
      setMessage(data);
    } else {
      setMessage("");
    }

    setSelectedMeeting(meetingData);
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:3000/auth/api/auth/logout",
        {},
        { withCredentials: true }
      );
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopy(true);
    setTimeout(() => setCopy(false), 2000);
  };

  // Dark mode calendar customization
  const calendarCustomStyles = {
    ".fc .fc-toolbar-title": {
      color: "#e0e0e0",
    },
    ".fc-theme-standard .fc-scrollgrid": {
      borderColor: "#333",
    },
    ".fc-theme-standard td, .fc-theme-standard th": {
      borderColor: "#333",
    },
    ".fc-day-today": {
      backgroundColor: "#2c3e50 !important",
    },
    ".fc-day": {
      backgroundColor: "#1e1e1e",
    },
    ".fc-day-other": {
      backgroundColor: "#181818",
    },
    ".fc-col-header-cell": {
      backgroundColor: "#1e1e1e",
      color: "#e0e0e0",
      padding: "10px",
    },
    ".fc-list-day-cushion": {
      backgroundColor: "#1e1e1e !important",
      color: "#e0e0e0 !important",
    },
    ".fc-list-event:hover td": {
      backgroundColor: "#2c3e50 !important",
    },
    ".fc-list-empty": {
      backgroundColor: "#1e1e1e !important",
      color: "#a0a0a0 !important",
    },
    ".fc-timegrid-slot": {
      color: "#a0a0a0",
    },
    ".fc-timegrid-axis": {
      color: "#a0a0a0",
    },
    ".fc-button-primary": {
      backgroundColor: "#2c3e50 !important",
      borderColor: "#34495e !important",
    },
    ".fc-button-primary:hover": {
      backgroundColor: "#34495e !important",
      borderColor: "#3d5a73 !important",
    },
    ".fc-button-active": {
      backgroundColor: "#3d5a73 !important",
      borderColor: "#4a6885 !important",
    },
    ".fc-today-button": {
      backgroundColor: "#2c3e50 !important",
      borderColor: "#34495e !important",
    },
    ".fc-toolbar button": {
      color: "#e0e0e0 !important",
    },
    ".fc-daygrid-day-number": {
      color: "#e0e0e0",
    },
    ".fc-list-day-text, .fc-list-day-side-text": {
      color: "#e0e0e0 !important",
    },
    ".fc-list-event-time": {
      color: "#a0a0a0 !important",
    },
    ".fc-list-event-title": {
      color: "#e0e0e0 !important",
    },
    ".fc-timegrid-event-harness .fc-event": {
      border: "none",
    },
    ".fc-daygrid-event-harness .fc-event": {
      border: "none",
      borderRadius: "3px",
      padding: "2px 4px",
    },
  };

  return (
    <div
      className="calendar-container"
      style={{
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "#e0e0e0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <div
        className="calendar-wrapper"
        style={{
          width: "100%",
          maxWidth: "1000px",
          backgroundColor: "#1e1e1e",
          boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",
          borderRadius: "8px",
          padding: "24px",
        }}
      >
        <div
          className="header"
          style={{ textAlign: "center", marginBottom: "24px" }}
        >
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "600",
              color: "#e0e0e0",
              marginBottom: "8px",
            }}
          >
            Meeting Dashboard
          </h1>
          
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Loading your meetings...</p>
          </div>
        ) : (
          <div className="calendar-section">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
              ]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              selectable={true}
              selectMirror={true}
              themeSystem="standard"
              contentHeight={600}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: "08:00",
                endTime: "18:00",
              }}
              slotMinTime="06:00:00"
              slotMaxTime="21:00:00"
              nowIndicator={true}
              dayMaxEvents={true}
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: false,
                hour12: false,
              }}
              viewDidMount={(view) => {
                // Apply custom styles after calendar is mounted
                Object.entries(calendarCustomStyles).forEach(
                  ([selector, styles]) => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach((el) => {
                      Object.entries(styles).forEach(([prop, value]) => {
                        el.style[prop] = value;
                      });
                    });
                  }
                );

                // Apply additional global styles
                const calendarElement = document.querySelector(".fc");
                if (calendarElement) {
                  calendarElement.style.fontFamily =
                    "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
                  calendarElement.style.fontSize = "14px";
                  calendarElement.style.backgroundColor = "#1e1e1e";
                  calendarElement.style.color = "#e0e0e0";
                  calendarElement.style.borderRadius = "6px";
                }
              }}
            />
          </div>
        )}
      </div>

      {selectedMeeting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "#1e1e1e",
              color: "#e0e0e0",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0px 4px 25px rgba(0,0,0,0.4)",
              width: "380px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setSelectedMeeting(null)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "none",
                border: "none",
                color: "#a0a0a0",
                fontSize: "18px",
                cursor: "pointer",
                transition: "color 0.2s ease",
              }}
              onMouseOver={(e) => (e.target.style.color = "#e0e0e0")}
              onMouseOut={(e) => (e.target.style.color = "#a0a0a0")}
            >
              ✖
            </button>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "16px",
                paddingBottom: "8px",
                borderBottom: "1px solid #333",
              }}
            >
              {selectedMeeting.title}
            </h3>
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  marginBottom: "12px",
                  fontStyle: "italic",
                  color: "#a0a0a0",
                }}
              >
                {selectedMeeting.description}
              </p>
              <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                <strong style={{ color: "#bdbdbd" }}>Date & Time:</strong>{" "}
                <span>
                  {new Date(selectedMeeting.date).toLocaleString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>

              <p style={{ marginBottom: "12px", fontSize: "14px" }}>
                <strong style={{ color: "#bdbdbd" }}>Status:</strong>{" "}
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor: `${getStatusColor(
                      selectedMeeting.status,
                      0.2
                    )}`,
                    color: getStatusColor(selectedMeeting.status, 1),
                    border: `1px solid ${getStatusColor(
                      selectedMeeting.status,
                      0.4
                    )}`,
                  }}
                >
                  {selectedMeeting.status.charAt(0).toUpperCase() +
                    selectedMeeting.status.slice(1)}
                </span>
              </p>
            </div>

            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                backgroundColor: "#252525",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              {message.length > 0 ? (
                <div style={{ textAlign: "center" }}>
                  <p style={{ marginBottom: "8px", fontWeight: "500" }}>
                    Meeting Room Code
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      data-tooltip-id="copy-tooltip"
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#2c3e50",
                        color: "#e0e0e0",
                        border: "1px solid #34495e",
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = "#34495e";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = "#2c3e50";
                      }}
                      onClick={copyToClipboard}
                    >
                      {copy ? "✓ Copied" : "Copy Room Code"}
                    </button>
                    <Tooltip
                      id="copy-tooltip"
                      content="Copy to clipboard"
                      place="top"
                    />
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: "center", color: "#a0a0a0" }}>
                  Room code will be available on the meeting date
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <button
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#27ae60",
                  color: "#ffffff",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#219653";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#27ae60";
                }}
                onClick={() => {
                  let win = window.open(
                    `https://konnect-fun.vercel.app`,
                    "_blank"
                  );
                  win.focus();
                }}
              >
                <span style={{ fontSize: "14px" }}>☎️</span>
                <span>Join Meeting</span>
              </button>
            </div>

            <button
              style={{
                width: "100%",
                padding: "10px 16px",
                backgroundColor: "#2c3e50",
                color: "#e0e0e0",
                borderRadius: "4px",
                border: "1px solid #34495e",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#34495e";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#2c3e50";
              }}
              onClick={() => setSelectedMeeting(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingCalendar;
