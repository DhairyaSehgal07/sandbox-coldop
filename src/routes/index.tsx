import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div>
      <h1>Welcome to Bhatti Agri-tech</h1>
      <p>This is the home page.</p>
    </div>
  );
}
