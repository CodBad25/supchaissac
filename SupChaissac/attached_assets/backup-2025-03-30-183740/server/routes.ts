import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertSessionSchema, insertTeacherSetupSchema } from "@shared/schema";

function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API routes
  // Sessions
  app.get("/api/sessions", isAuthenticated, async (req, res) => {
    try {
      let sessions;
      
      // Filter sessions based on user role
      if (req.user!.role === "TEACHER") {
        sessions = await storage.getSessionsByTeacher(req.user!.id);
      } else {
        sessions = await storage.getSessions();
      }
      
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const session = await storage.getSessionById(parseInt(req.params.id));
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Teachers can only access their own sessions
      if (req.user!.role === "TEACHER" && session.teacherId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions", isAuthenticated, async (req, res) => {
    try {
      // Validate input
      const validatedData = insertSessionSchema.parse(req.body);
      
      // Teachers can only create sessions for themselves
      if (req.user!.role === "TEACHER" && validatedData.teacherId !== req.user!.id) {
        return res.status(403).json({ error: "Cannot create sessions for other teachers" });
      }
      
      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.patch("/api/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Check permissions based on role
      if (req.user!.role === "TEACHER") {
        // Teachers can only update their own sessions that are in PENDING_REVIEW status
        if (session.teacherId !== req.user!.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        
        if (session.status !== "PENDING_REVIEW") {
          return res.status(403).json({ error: "Cannot update sessions that are already in review" });
        }
      }
      
      const updatedSession = await storage.updateSession(sessionId, {
        ...req.body,
        updatedBy: req.user!.name
      });
      
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Check permissions
      if (req.user!.role === "TEACHER") {
        // Teachers can only delete their own sessions that are in PENDING_REVIEW
        if (session.teacherId !== req.user!.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        
        if (session.status !== "PENDING_REVIEW") {
          return res.status(403).json({ error: "Cannot delete sessions that are already in review" });
        }
      }
      
      await storage.deleteSession(sessionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // Teacher setup routes
  app.get("/api/teacher-setup", isAuthenticated, async (req, res) => {
    try {
      const teacherId = req.user!.id;
      let setup = await storage.getTeacherSetup(teacherId);
      
      if (!setup) {
        // Create a default setup if none exists
        setup = await storage.createTeacherSetup({
          teacherId,
          inPacte: false
        });
      }
      
      res.json(setup);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teacher setup" });
    }
  });

  app.patch("/api/teacher-setup", isAuthenticated, async (req, res) => {
    try {
      if (req.user!.role !== "TEACHER") {
        return res.status(403).json({ error: "Only teachers can update their setup" });
      }
      
      const teacherId = req.user!.id;
      let setup = await storage.getTeacherSetup(teacherId);
      
      if (!setup) {
        // Create a new setup if none exists
        setup = await storage.createTeacherSetup({
          teacherId,
          ...req.body
        });
      } else {
        // Update existing setup
        setup = await storage.updateTeacherSetup(teacherId, req.body);
      }
      
      res.json(setup);
    } catch (error) {
      res.status(500).json({ error: "Failed to update teacher setup" });
    }
  });

  // User profile routes
  app.patch("/api/user/signature", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { signature } = req.body;
      
      if (!signature) {
        return res.status(400).json({ error: "Signature is required" });
      }
      
      const user = await storage.updateUser(userId, { signature });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update signature" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
