import React from 'react';

interface UserAvatarProps {
  name?: string;
  foto?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name, foto }) => {
  const initials = typeof name === 'string' ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : 'SU';
  if (foto && foto.length > 10) {
    return <img src={foto} alt={name} className="rounded-circle" style={{ width: 36, height: 36, objectFit: 'cover', border: '2px solid #eee' }} />;
  }
  return (
    <span className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36, fontSize: 18 }}>
      {initials}
    </span>
  );
};

export default UserAvatar;
