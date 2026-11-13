import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The home-screen icon: the site's mark (a gripper over a token) on ink. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#15171e" }}>
        <svg width="132" height="132" viewBox="0 0 28 28">
          <path d="M14 5v4M8 9h12M9 9v8M19 9v8" fill="none" stroke="#f3f4f7" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="11" y="16" width="6" height="6" rx="1.6" fill="#ffd43b" />
        </svg>
      </div>
    ),
    size,
  );
}
