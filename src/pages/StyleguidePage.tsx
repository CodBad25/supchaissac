import React from 'react';
import {
  Shield, Check, X, AlertCircle, Info, Clock, Users,
  BookOpen, FileText, ChevronRight, Plus, Edit, Trash2
} from 'lucide-react';
import { colors, components, cn } from '../styles/theme';

/**
 * 🎨 STYLEGUIDE - SupChaissac v2.0
 *
 * Cette page documente visuellement tous les composants, couleurs,
 * et patterns de design de l'application.
 */

const StyleguidePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Design System SupChaissac
          </h1>
          <p className="text-gray-600">
            Guide de style et composants réutilisables v2.0
          </p>
        </div>

        {/* ===== COULEURS ===== */}
        <Section title="🎨 Couleurs" id="colors">
          {/* Couleur principale */}
          <SubSection title="Couleur principale (Jaune signature)">
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(colors.primary).map(([shade, className]) => (
                <ColorSwatch
                  key={shade}
                  label={`Yellow ${shade}`}
                  className={className}
                />
              ))}
            </div>
          </SubSection>

          {/* Couleurs neutres */}
          <SubSection title="Couleurs neutres (Gris)">
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(colors.neutral).map(([shade, className]) => (
                <ColorSwatch
                  key={shade}
                  label={`Gray ${shade}`}
                  className={className}
                />
              ))}
            </div>
          </SubSection>

          {/* Couleurs par niveau */}
          <SubSection title="Couleurs par niveau de classe">
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(colors.grade).map(([level, styles]) => (
                <div key={level} className={cn(
                  'p-4 rounded-lg border-2 text-center',
                  styles.full
                )}>
                  <div className="font-bold">{level}</div>
                </div>
              ))}
            </div>
          </SubSection>

          {/* Couleurs par type de session */}
          <SubSection title="Couleurs par type de session">
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(colors.sessionType).map(([type, styles]) => (
                <div key={type} className={cn(
                  'p-6 rounded-lg border-2 text-center',
                  styles.full
                )}>
                  <div className="font-bold text-lg">{type}</div>
                </div>
              ))}
            </div>
          </SubSection>

          {/* Couleurs par statut */}
          <SubSection title="Couleurs par statut">
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(colors.status).map(([status, styles]) => (
                <div key={status} className={cn(
                  'p-4 rounded-lg border-2 text-center',
                  styles.full
                )}>
                  <div className="font-semibold text-xs mb-2">{status}</div>
                  <div className="text-xs">{styles.label}</div>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ===== BOUTONS ===== */}
        <Section title="🔘 Boutons" id="buttons">
          <SubSection title="Variantes de boutons">
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <button className={cn(components.button.primary)}>
                  Bouton Principal
                </button>
                <button className={cn(components.button.secondary)}>
                  Bouton Secondaire
                </button>
                <button className={cn(components.button.danger)}>
                  Bouton Danger
                </button>
                <button className={cn(components.button.ghost)}>
                  Bouton Ghost
                </button>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <button className={cn(components.button.primary, components.button.small)}>
                  Petit bouton
                </button>
                <button className={cn(components.button.primary)} disabled>
                  Désactivé
                </button>
              </div>
            </div>
          </SubSection>

          <SubSection title="Boutons avec icônes">
            <div className="flex items-center gap-4 flex-wrap">
              <button className={cn(components.button.primary, 'flex items-center gap-2')}>
                <Plus className="w-5 h-5" />
                Ajouter
              </button>
              <button className={cn(components.button.secondary, 'flex items-center gap-2')}>
                <Edit className="w-5 h-5" />
                Modifier
              </button>
              <button className={cn(components.button.danger, 'flex items-center gap-2')}>
                <Trash2 className="w-5 h-5" />
                Supprimer
              </button>
            </div>
          </SubSection>
        </Section>

        {/* ===== CARTES ===== */}
        <Section title="🃏 Cartes" id="cards">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Carte glass */}
            <div className={cn(components.card.glass)}>
              <h3 className="text-lg font-bold mb-2">Carte Glass</h3>
              <p className="text-gray-600 text-sm">
                Effet verre dépoli avec backdrop blur
              </p>
            </div>

            {/* Carte simple */}
            <div className={cn(components.card.simple)}>
              <h3 className="text-lg font-bold mb-2">Carte Simple</h3>
              <p className="text-gray-600 text-sm">
                Carte standard avec ombre
              </p>
            </div>

            {/* Carte cliquable */}
            <div className={cn(components.card.clickable)}>
              <h3 className="text-lg font-bold mb-2">Carte Cliquable</h3>
              <p className="text-gray-600 text-sm">
                Avec effets hover et active
              </p>
            </div>
          </div>
        </Section>

        {/* ===== INPUTS ===== */}
        <Section title="📝 Champs de saisie" id="inputs">
          <SubSection title="Input standard">
            <div className="max-w-md space-y-4">
              <div>
                <label className={cn(components.label)}>
                  <Users className="w-3 h-3 text-yellow-500" />
                  Email
                </label>
                <input
                  type="email"
                  placeholder="votre.email@example.com"
                  className={cn(components.input.base)}
                />
              </div>

              <div>
                <label className={cn(components.label)}>
                  <Clock className="w-3 h-3 text-yellow-500" />
                  Date
                </label>
                <input
                  type="date"
                  className={cn(components.input.base)}
                />
              </div>

              <div>
                <label className={cn(components.label)}>
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  Input avec erreur
                </label>
                <input
                  type="text"
                  placeholder="Champ requis"
                  className={cn(components.input.base, components.input.error)}
                />
                <p className="text-xs text-red-600 mt-1">Ce champ est obligatoire</p>
              </div>
            </div>
          </SubSection>
        </Section>

        {/* ===== BADGES ===== */}
        <Section title="🏷️ Badges" id="badges">
          <SubSection title="Badges par statut">
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(colors.status).map(([status, styles]) => (
                <span
                  key={status}
                  className={cn(
                    components.badge.base,
                    styles.full
                  )}
                >
                  {styles.label}
                </span>
              ))}
            </div>
          </SubSection>

          <SubSection title="Badges par type de session">
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(colors.sessionType).map(([type, styles]) => (
                <span
                  key={type}
                  className={cn(
                    components.badge.base,
                    styles.full
                  )}
                >
                  <BookOpen className="w-3 h-3" />
                  {type}
                </span>
              ))}
            </div>
          </SubSection>

          <SubSection title="Badges par niveau">
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(colors.grade).map(([level, styles]) => (
                <span
                  key={level}
                  className={cn(
                    components.badge.base,
                    styles.full
                  )}
                >
                  {level}
                </span>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ===== ICÔNES ===== */}
        <Section title="🎭 Icônes" id="icons">
          <SubSection title="Icônes Lucide courantes">
            <div className="grid grid-cols-6 md:grid-cols-12 gap-4">
              {[
                Shield, Check, X, AlertCircle, Info, Clock,
                Users, BookOpen, FileText, ChevronRight, Plus,
                Edit, Trash2
              ].map((Icon, index) => (
                <div key={index} className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200">
                  <Icon className="w-6 h-6 text-yellow-500" />
                  <span className="text-xs text-gray-600">{Icon.name}</span>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ===== TYPOGRAPHIE ===== */}
        <Section title="📝 Typographie" id="typography">
          <SubSection title="Tailles de texte">
            <div className="space-y-3">
              <p className="text-xs">Text XS - 12px</p>
              <p className="text-sm">Text SM - 14px</p>
              <p className="text-base">Text Base - 16px</p>
              <p className="text-lg">Text LG - 18px</p>
              <p className="text-xl">Text XL - 20px</p>
              <p className="text-2xl">Text 2XL - 24px</p>
              <p className="text-3xl">Text 3XL - 30px</p>
              <p className="text-4xl">Text 4XL - 36px</p>
            </div>
          </SubSection>

          <SubSection title="Poids de police">
            <div className="space-y-2">
              <p className="font-light">Font Light (300)</p>
              <p className="font-normal">Font Normal (400)</p>
              <p className="font-medium">Font Medium (500)</p>
              <p className="font-semibold">Font Semibold (600)</p>
              <p className="font-bold">Font Bold (700)</p>
              <p className="font-extrabold">Font Extrabold (800)</p>
            </div>
          </SubSection>
        </Section>

        {/* ===== ESPACEMENTS ===== */}
        <Section title="📏 Espacements" id="spacing">
          <SubSection title="Padding (espacement interne)">
            <div className="space-y-2">
              {[
                { size: 'xs', px: '8px' },
                { size: 'sm', px: '12px' },
                { size: 'base', px: '16px' },
                { size: 'lg', px: '24px' },
                { size: 'xl', px: '32px' },
                { size: '2xl', px: '48px' },
              ].map(({ size, px }) => (
                <div key={size} className="flex items-center gap-4">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded w-20">
                    p-{size}
                  </code>
                  <div className={`bg-yellow-100 border-2 border-yellow-300 p-${size}`}>
                    <div className="bg-white border border-gray-300 px-2 py-1 text-sm">
                      {px}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ===== OMBRES ===== */}
        <Section title="🌑 Ombres" id="shadows">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['sm', 'base', 'md', 'lg', 'xl', '2xl'].map((size) => (
              <div key={size} className={`bg-white rounded-lg p-6 shadow-${size}`}>
                <code className="text-sm">shadow-{size}</code>
              </div>
            ))}
            <div className="bg-white rounded-lg p-6 shadow-lg shadow-yellow-500/25">
              <code className="text-sm">shadow-yellow-glow</code>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-2xl shadow-yellow-500/35">
              <code className="text-sm">shadow-yellow-glow-lg</code>
            </div>
          </div>
        </Section>

        {/* ===== ANIMATIONS ===== */}
        <Section title="🎬 Animations" id="animations">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 animate-fade-in">
              <code className="text-sm">animate-fade-in</code>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200 animate-slide-in-bottom">
              <code className="text-sm">animate-slide-in-bottom</code>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200 animate-slide-in-left">
              <code className="text-sm">animate-slide-in-left</code>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

// ===== COMPOSANTS HELPERS =====

const Section: React.FC<{ title: string; id: string; children: React.ReactNode }> = ({
  title,
  id,
  children,
}) => {
  return (
    <section id={id} className="mb-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">
        {title}
      </h2>
      <div className="space-y-8">
        {children}
      </div>
    </section>
  );
};

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
};

const ColorSwatch: React.FC<{ label: string; className: string }> = ({
  label,
  className,
}) => {
  return (
    <div className="text-center">
      <div className={cn(className, 'h-20 rounded-lg border-2 border-gray-300 mb-2')} />
      <code className="text-xs text-gray-600">{label}</code>
    </div>
  );
};

export default StyleguidePage;
