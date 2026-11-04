import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="lede">That page doesn't exist (yet). <Link to="/patterns">Browse the patterns</Link> or go <Link to="/">home</Link>.</p>
    </div>
  );
}
