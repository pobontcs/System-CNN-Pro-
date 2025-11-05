import Container from "../components/Layout/Container";
import Nav from "../components/Layout/Nav";

export default function History(){
  return (
    <>
      <Nav />
      <Container>
        <h1 className="text-2xl font-bold mb-4">History</h1>
        <p className="text-sm text-gray-600">Coming soon: list of past detections & CSV export.</p>
      </Container>
    </>
  );
}
