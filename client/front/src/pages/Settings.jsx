import Container from "../components/Layout/Container";
import Nav from "../components/Layout/Nav";
import { API, USE_MOCK } from "../lib/api";

export default function Settings(){
  return (
    <>
      <Nav />
      <Container>
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <div className="rounded-2xl border p-4 space-y-2 text-sm">
          <div><b>API Base:</b> {API}</div>
          <div><b>Use Mock:</b> {String(USE_MOCK)}</div>
          <div className="text-gray-600">Edit values in <code>.env</code> and restart <code>npm run dev</code>.</div>
        </div>
      </Container>
    </>
  );
}
