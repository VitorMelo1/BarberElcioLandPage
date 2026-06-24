import { BookingModal } from "./components/BookingModal/BookingModal";
import { AuthProvider } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";
import { Landing } from "./pages/Landing/Landing";

/** Entrypoint: providers de auth/agendamento + a landing + o modal de agendamento. */
export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <Landing />
        <BookingModal />
      </BookingProvider>
    </AuthProvider>
  );
}
