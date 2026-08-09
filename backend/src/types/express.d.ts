// Augments Express's Request type so req.userId is recognized throughout
// the app after the requireAuth middleware runs.
declare namespace Express {
  export interface Request {
    userId?: string;
    userEmail?: string;
  }
}
