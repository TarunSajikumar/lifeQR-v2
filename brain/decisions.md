# Decisions — Engineering Decision Records (ADR)

## 001 — Separate Public Website and Web Application Folders
- **Date**: 2026-08-02
- **Status**: Approved & Implemented
- **Context**: Formerly all frontend HTML and JS files were crammed into a single `frontend/` directory.
- **Decision**: Split frontend into `website/` (marketing/landing) and `app/` (dashboards/portals).
- **Rationale**: Clean separation of marketing assets from application logic, simpler build pipeline, distinct security boundaries.
- **Impact**: Express `server.js` updated to host `website/` on `/` and `app/` on `/app` and direct routes.

## 002 — Public DNS Fallback for MongoDB Atlas SRV Lookups
- **Date**: 2026-08-02
- **Status**: Approved & Implemented
- **Context**: Node.js v25 DNS resolver throws `querySrv ECONNREFUSED` on certain local network configurations when querying `mongodb+srv://` URIs.
- **Decision**: Explicitly set public DNS resolvers `dns.setServers(['8.8.8.8', '1.1.1.1'])` prior to Mongoose connection attempts.
- **Rationale**: Guarantees zero-failure MongoDB SRV lookups across local and cloud environments.

## 003 — Socket.IO Real-time SOS Dispatch
- **Date**: 2026-08-02
- **Status**: Approved & Implemented
- **Context**: SOS emergency alerts require instant zero-polling delivery to on-duty ambulance crews.
- **Decision**: Integrate Socket.IO with Express server and manage room subscriptions (`crew:all`, `patient:<id>`).
- **Rationale**: Provides instant push notifications and real-time location coordinate streaming.
