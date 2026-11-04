import type { Plugin } from "vite";
export interface Licence { name: string; version: string; license: string; url: string }
export function siteUrl(): string;
export function licences(root?: string): Licence[];
export function licencesPlugin(): Plugin;
export function routes(root?: string): string[];
export function sitePlugin(): Plugin;
export function headPlugin(o?: { standalone?: boolean }): Plugin;
