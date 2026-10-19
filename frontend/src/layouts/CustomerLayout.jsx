import { Outlet } from 'react-router-dom';
import Header from '../components/customer/Header';
import Footer from '../components/customer/Footer';
import ChatWidget from '../components/customer/ChatWidget';

export default function CustomerLayout() {
  return (
    <div className="flex-col" style={{ minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
