import React from "react";
import { Link } from "react-router-dom";

const SearchResultItem = ({ user, onClick }) => {
  console.log(user);
  return (
    <Link
      to={`/profile/${user._id}`}
      className="block p-4 bg-gray-800 hover:bg-gray-700 rounded-md mb-2"
      onClick={onClick}
    >
      <div className="flex items-center">
        <img
          src={user.avatar}
          alt={`${user.username}'s avatar`}
          className="w-10 h-10 rounded-full mr-4"
        />
        <div>
          <div className="text-white font-bold">{user.username}</div>
          <div className="text-gray-400">{user.email}</div>
          <div className="text-gray-400">{user.collegename}</div>
        </div>
      </div>
      <div className="mt-2">
        {user.interest.map((interest, index) => (
          <span
            key={index}
            className="inline-block bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full mr-2 mb-2"
          >
            {interest}
          </span>
        ))}
      </div>
    </Link>
  );
};

export default SearchResultItem;
