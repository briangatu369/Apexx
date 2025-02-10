import useAuthStore from "@/stores/authStore";

const Authenticated = () => {
  const userData = useAuthStore((state) => state.userData);

  return (
    <div className="flex flex-col space-y-1/2 p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-xl font-bold text-gray-800">
        Account Balance:
        <span className="text-green-600 ml-2">${userData?.accountBalance}</span>
      </h1>
      <h1 className="text-lg text-gray-700">
        Username:
        <span className="font-semibold ml-2">{userData?.username}</span>
      </h1>
    </div>
  );
};

export default Authenticated;
