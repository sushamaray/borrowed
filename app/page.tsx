import './css/landing.css';
import borrowedBg from './images/borrow.png';
import Link from 'next/link';

const BorrowedLanding = () => {
  const heroStyle = {
    backgroundImage: `linear-gradient(to right, rgba(30, 20, 60, 0.95) 0%, rgba(40, 25, 75, 0.8) 40%, rgba(0, 0, 0, 0.2) 100%), url(${borrowedBg.src})`,
  };

  return (
    <div className="borrowed-layout">


      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="logo-container">
          <div className="logo-box">B</div>
          <span className="logo-text">Borrowed</span>
        </div>

        <nav className="nav-links">
          <a href="#">Home</a>
          <a href="#">Features</a>
          <a href="#">How it Works</a>
        </nav>

        <div className="nav-actions">
          <Link href="/login">
            <button className="signup-btn">Get Started</button>
          </Link>
        </div>
      </header>

      {/* Main Hero Section with Background Image */}
      <main className="hero-section" style={heroStyle}>
        <div className="hero-content">

          <div className="badge">
            <span className="dot"></span>
            Bangladesh's First Trusted Peer-to-Peer Platform
          </div>

          <h1 className="hero-title">
            Borrow What You<br />
            Need.<br />
            Share What You<br />
            Don't.
          </h1>

          <p className="hero-subtitle">
            A trusted platform for lending and borrowing everyday items securely within
            your community. Verify, connect, and save.
          </p>

          <div className="button-group">
            <button className="primary-btn">
              Get Started <span>🚀</span>
            </button>
            <button className="secondary-btn">
              Browse Items
            </button>
          </div>

        </div>
      </main>

    </div>
  );
};

export default BorrowedLanding;