export default function UserIcon({ userIcon }: { userIcon: string }) {
  return (
    <div className="flex items-end drop-shadow-[0_5px_5px_rgba(0,0,0,0.4)]">
      <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex">
        <img src={userIcon} alt="User Icon" />
      </div>
      <div className="w-[7px] h-[7px] bg-green-400 rounded-full mb-[5px] ml-[-8px] z-50"></div>
    </div>
  );
}
