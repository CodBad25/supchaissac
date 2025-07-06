import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertSessionSchema, insertTeacherSetupSchema, insertSystemSettingSchema } from "@shared/schema";
import path from "path";
import express from "express";
import fs from "fs";

function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Serve documentation files
  app.use('/docs', express.static(path.join(process.cwd(), 'docs')));

  // Special route for the documentation index
  app.get('/documentation', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'docs', 'workflow.html'));
  });

  // Route to download the complete documentation
  app.get('/download-documentation', (req, res) => {
    const filePath = path.join(process.cwd(), 'docs', 'documentation_complete.md');
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Documentation non disponible. Veuillez contacter l\'administrateur.');
    }
    
    // Configuration des en-têtes pour forcer le téléchargement
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="documentation_complete.md"');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Lire et envoyer le fichier
    const fileContent = fs.readFileSync(filePath, 'utf8');
    res.send(fileContent);
  });
  
  // Route pour afficher la documentation dans un navigateur (alternative au téléchargement)
  app.get('/view-documentation', (req, res) => {
    const filePath = path.join(process.cwd(), 'docs', 'documentation_complete.md');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Documentation non disponible. Veuillez contacter l\'administrateur.');
    }
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Page HTML simple qui affiche le contenu Markdown formaté
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Documentation Complète - Gestion des Heures</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 1rem;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            color: #111;
          }
          h1 { font-size: 2.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
          h2 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
          h3 { font-size: 1.5em; }
          p, ul, ol { margin: 1em 0; }
          code {
            background: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: monospace;
          }
          pre {
            background: #f5f5f5;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
          }
          a { color: #0366d6; text-decoration: none; }
          a:hover { text-decoration: underline; }
          hr { border: 0; border-top: 1px solid #eee; margin: 2em 0; }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th, td {
            padding: 0.5em;
            text-align: left;
          }
          .download-button {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 10px 15px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <a href="/download-documentation" class="download-button">Télécharger cette documentation</a>
        <div id="content">
          ${content.replace(/\n/g, '<br>').replace(/\#\#\#\#? (.*)/g, '<h3>$1</h3>').replace(/\#\#\# (.*)/g, '<h3>$1</h3>').replace(/\#\# (.*)/g, '<h2>$1</h2>').replace(/\# (.*)/g, '<h1>$1</h1>')}
        </div>
        <a href="/download-documentation" class="download-button">Télécharger cette documentation</a>
      </body>
      </html>
    `;
    
    res.send(html);
  });

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
  
  // Route spécifique pour récupérer les sessions d'un enseignant par son ID
  app.get("/api/sessions/teacher/:teacherId", isAuthenticated, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      
      // Vérifier les permissions
      if (req.user!.role === "TEACHER" && req.user!.id !== teacherId) {
        return res.status(403).json({ error: "Un enseignant ne peut consulter que ses propres sessions" });
      }
      
      const sessions = await storage.getSessionsByTeacher(teacherId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Impossible de récupérer les sessions de cet enseignant" });
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
  
  // Route pour vérifier si une session est toujours éditable
  app.get("/api/sessions/:id/edit-status", isAuthenticated, async (req, res) => {
    try {
      const session = await storage.getSessionById(parseInt(req.params.id));
      
      if (!session) {
        return res.status(404).json({ error: "Session non trouvée" });
      }
      
      // Teachers can only check their own sessions
      if (req.user!.role === "TEACHER" && session.teacherId !== req.user!.id) {
        return res.status(403).json({ error: "Accès refusé" });
      }
      
      // Si ce n'est pas un enseignant ou si le statut n'est pas SUBMITTED, pas besoin de vérifier le délai
      if (req.user!.role !== "TEACHER" || (session.status !== "SUBMITTED" && session.status !== "INCOMPLETE")) {
        return res.json({
          isEditable: req.user!.role !== "TEACHER" || session.status === "SUBMITTED" || session.status === "INCOMPLETE",
          editWindow: null,
          elapsed: null,
          remaining: null
        });
      }
      
      // Vérifier si le temps de modification n'a pas expiré
      const editWindowSetting = await storage.getSystemSettingByKey("SESSION_EDIT_WINDOW");
      const editWindowMinutes = editWindowSetting ? parseInt(editWindowSetting.value) : 60; // Par défaut 60 minutes
      const creationTime = new Date(session.createdAt).getTime();
      const currentTime = new Date().getTime();
      const diffMinutes = Math.floor((currentTime - creationTime) / (1000 * 60));
      const remainingMinutes = Math.max(0, editWindowMinutes - diffMinutes);
      
      return res.json({
        isEditable: diffMinutes <= editWindowMinutes,
        editWindow: editWindowMinutes,
        elapsed: diffMinutes,
        remaining: remainingMinutes
      });
    } catch (error) {
      res.status(500).json({ error: "Impossible de vérifier le statut d'édition" });
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
        // Teachers can only update their own sessions that are in SUBMITTED or INCOMPLETE status
        if (session.teacherId !== req.user!.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        
        if (session.status !== "SUBMITTED" && session.status !== "INCOMPLETE") {
          return res.status(403).json({ error: "Impossible de modifier les séances qui sont déjà en cours de vérification ou validées" });
        }
        
        // Les enseignants ne peuvent pas changer le type (c'est réservé au principal)
        if (req.body.type && req.body.type !== session.type) {
          return res.status(403).json({ 
            error: "Les enseignants ne peuvent pas changer le type de séance. Cette fonctionnalité est réservée à la direction." 
          });
        }
      } else if (req.user!.role === "ADMIN") {
        // Admins can view but not change session status (reserved for PRINCIPAL/SECRETARY)
        if (req.body.status && req.body.status !== session.status) {
          return res.status(403).json({ 
            error: "Les administrateurs ne peuvent pas changer le statut des séances. Cette fonctionnalité est réservée à la direction et au secrétariat." 
          });
        }
        
        // Les administrateurs ne peuvent pas changer le type (c'est réservé au principal)
        if (req.body.type && req.body.type !== session.type) {
          return res.status(403).json({ 
            error: "Les administrateurs ne peuvent pas changer le type de séance. Cette fonctionnalité est réservée à la direction." 
          });
        }
        
        // Vérifier si le temps de modification n'a pas expiré
        const editWindowSetting = await storage.getSystemSettingByKey("SESSION_EDIT_WINDOW");
        if (editWindowSetting) {
          const editWindowMinutes = parseInt(editWindowSetting.value);
          const creationTime = new Date(session.createdAt).getTime();
          const currentTime = new Date().getTime();
          const diffMinutes = Math.floor((currentTime - creationTime) / (1000 * 60));
          
          if (diffMinutes > editWindowMinutes) {
            return res.status(403).json({ 
              error: "Le délai de modification a expiré", 
              details: {
                editWindow: editWindowMinutes,
                elapsed: diffMinutes,
                remaining: 0
              }
            });
          }
        }
      } else if (req.user!.role === "PRINCIPAL") {
        // Le principal peut changer le type de la session et son statut
        // Mais on préserve toujours le type d'origine
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
  
  // Route spécifique pour la validation des sessions par le principal avec transformation du type
  app.patch("/api/sessions/:id/validate", isAuthenticated, async (req, res) => {
    try {
      // Vérifier que seul le principal peut accéder à cette route
      if (req.user!.role !== "PRINCIPAL") {
        return res.status(403).json({ 
          error: "Seule la direction peut valider et transformer les séances" 
        });
      }
      
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session non trouvée" });
      }
      
      // Vérifier que la session est dans un état qui permet la validation
      if (session.status !== "SUBMITTED" && 
          session.status !== "INCOMPLETE" && 
          session.status !== "REVIEWED") {
        return res.status(400).json({ 
          error: "Cette session ne peut pas être validée car elle est déjà validée, payée ou rejetée" 
        });
      }
      
      const { type, status, comment } = req.body;
      let transformationComment = "";
      
      // Si le type est modifié, ajouter un commentaire 
      if (type && type !== session.type) {
        transformationComment = `Type transformé de ${session.type} à ${type} par ${req.user!.name}`;
        if (comment) {
          transformationComment += ` - Commentaire: ${comment}`;
        }
      }
      
      // Combiner le commentaire existant avec le nouveau
      const finalComment = session.comment 
        ? `${session.comment}\n\n${transformationComment}` 
        : transformationComment;
      
      const updatedSession = await storage.updateSession(sessionId, {
        type: type || session.type,
        status: status || "VALIDATED", // Par défaut, on passe au statut VALIDATED
        comment: finalComment,
        updatedBy: req.user!.name
      });
      
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: "Impossible de valider la session" });
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
        // Teachers can only delete their own sessions that are in SUBMITTED or INCOMPLETE
        if (session.teacherId !== req.user!.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        
        if (session.status !== "SUBMITTED" && session.status !== "INCOMPLETE") {
          return res.status(403).json({ error: "Impossible de supprimer les séances qui sont déjà en cours de vérification ou validées" });
        }
      } else if (req.user!.role === "ADMIN") {
        // Administrators cannot delete sessions that are already validated
        if (session.status === "VALIDATED") {
          return res.status(403).json({ 
            error: "Les administrateurs ne peuvent pas supprimer des séances déjà validées. Cette opération est réservée à la direction." 
          });
        }
        
        // Vérifier si le temps de modification n'a pas expiré
        const editWindowSetting = await storage.getSystemSettingByKey("SESSION_EDIT_WINDOW");
        if (editWindowSetting) {
          const editWindowMinutes = parseInt(editWindowSetting.value);
          const creationTime = new Date(session.createdAt).getTime();
          const currentTime = new Date().getTime();
          const diffMinutes = Math.floor((currentTime - creationTime) / (1000 * 60));
          
          if (diffMinutes > editWindowMinutes) {
            return res.status(403).json({ 
              error: "Le délai de modification a expiré", 
              details: {
                editWindow: editWindowMinutes,
                elapsed: diffMinutes,
                remaining: 0
              }
            });
          }
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

  // System settings routes (admin only)
  function isAdmin(req: Request, res: Response, next: Function) {
    if (req.isAuthenticated() && (req.user!.role === "ADMIN" || req.user!.username === "admin@example.com")) {
      return next();
    }
    res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }

  app.get("/api/system-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Impossible de récupérer les paramètres système" });
    }
  });

  app.get("/api/system-settings/:key", isAuthenticated, async (req, res) => {
    try {
      const setting = await storage.getSystemSettingByKey(req.params.key);
      
      if (!setting) {
        return res.status(404).json({ error: "Paramètre non trouvé" });
      }
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Impossible de récupérer le paramètre" });
    }
  });

  app.patch("/api/system-settings/:key", isAdmin, async (req, res) => {
    try {
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ error: "La valeur du paramètre est requise" });
      }
      
      const setting = await storage.getSystemSettingByKey(req.params.key);
      
      if (!setting) {
        return res.status(404).json({ error: "Paramètre non trouvé" });
      }
      
      const updatedSetting = await storage.updateSystemSetting(
        req.params.key,
        value,
        req.user!.name
      );
      
      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ error: "Impossible de mettre à jour le paramètre" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
