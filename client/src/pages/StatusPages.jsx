import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

function Status({ code, title, message }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-serif-display text-8xl text-brand-500">{code}</p>
      <h1 className="mt-4 font-serif-display text-3xl">{title}</h1>
      <p className="mt-2 max-w-md text-muted">{message}</p>
      <Link to="/" className="mt-6"><Button>Go to dashboard</Button></Link>
    </div>
  );
}

export const NotFound = () => <Status code="404" title="Page not found" message="The page you're looking for doesn't exist or was moved." />;
export const Forbidden = () => <Status code="403" title="Access denied" message="You don't have permission to view this page. Admin access is required." />;
