export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Socket.io Real-Time Chat. All rights reserved.
        </p>
        <p className="text-xs mt-2">
          Built with ❤️ using MERN Stack and Socket.IO
        </p>
      </div>
    </footer>
  );
}