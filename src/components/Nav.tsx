import { config } from '@/lib/config';

export default function Nav() {
  return (
    <nav className="top">
      <div className="brand">~/{config.firstName}.{config.lastName}</div>
      <div className="links">
        <a href="#about">about</a>
        <a href="#experience">experience</a>
        <a href="#oss">open_source</a>
        <a href="#achievements">wins</a>
        <a href="#contact">contact</a>
      </div>
      <div className="status">
        <span className="dot" />
        <span>{config.availability}</span>
      </div>
    </nav>
  );
}
