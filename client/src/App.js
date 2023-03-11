import axios from "axios";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { UserContextProvider } from "./components/UserContext";
import Profile from "./pages/Profile";
import IndexPage from "./pages/IndexPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Places from "./pages/Places";
import PlaceForm from "./pages/PlaceForm";
import Detail from "./pages/Detail";
import Booking from "./pages/Booking";
import Bookings from "./pages/Bookings";

axios.defaults.baseURL = "http://localhost:4000";
axios.defaults.withCredentials = true;
function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<IndexPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Profile />} />
          <Route path="/account/places" element={<Places />} />
          <Route path="/account/places/new" element={<PlaceForm />} />
          <Route path="/account/places/:id" element={<PlaceForm />} />
          <Route path="/place/:id" element={<Detail />} />
          <Route path="/account/bookings" element={<Bookings />} />
          <Route path="/account/bookings/:id" element={<Booking />} />

          {/* <Route path="/account/places" element={<Account />} /> */}
        </Route>
      </Routes>
    </UserContextProvider>
  );
}

export default App;
