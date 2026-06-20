import React from "react";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import "./dashboardfooter.css"; // Import the CSS file directly
import { FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="content">
          <div className="links">
            <span className="copyright link">
              Copyright © {currentYear}{" "}
              <Link href="https://www.mntfuture.com/">MnT</Link>
            </span>
            <Link href="/refund-policy">
              <p className="link">Refund Policy</p>
            </Link>
            <Link href="/terms-of-service">
              <p className="link">Terms and Conditions</p>
            </Link>
            
          </div>
          {/* <nav className="socialLinks" aria-label="Social media links">
            <Link
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <FaXTwitter />
            </Link>
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </Link>
            <Link
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <FaYoutube />
            </Link>
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn />
            </Link>
          </nav> */}
        </div>
      </div>
    </footer>
  );
}
