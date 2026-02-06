// Utilitaire de chiffrement AES-256-GCM pour les credentials

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Générer une clé de chiffrement depuis la clé maître et le salt
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Chiffrer un mot de passe
 */
export function encryptPassword(plaintext: string): {
  encrypted: string;
  salt: string;
  iv: string;
  tag: string;
} {
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY non définie dans les variables d\'environnement');
  }

  // Générer salt et IV aléatoires
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Dériver la clé depuis la clé maître et le salt
  const key = deriveKey(masterKey, salt);

  // Créer le cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Chiffrer
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Récupérer le tag d'authentification
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Déchiffrer un mot de passe
 */
export function decryptPassword(
  encrypted: string,
  salt: string,
  iv: string,
  tag: string
): string {
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY non définie dans les variables d\'environnement');
  }

  try {
    // Convertir les hex en buffers
    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');

    // Dériver la clé
    const key = deriveKey(masterKey, saltBuffer);

    // Créer le decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(tagBuffer);

    // Déchiffrer
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Échec du déchiffrement. Données corrompues ou clé invalide.');
  }
}

/**
 * Générer une clé de chiffrement aléatoire (pour .env)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
