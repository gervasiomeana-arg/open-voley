import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import { WelcomeLandingPage } from '../src/components/WelcomeLandingPage';

// Build-time public content only. No accounts, secrets or per-user data.
const html = fs.readFileSync('dist/index.html', 'utf8');
const markup = renderToStaticMarkup(<WelcomeLandingPage onStartFreeTrial={() => {}} onClientLogin={() => {}} onOpenPlansModal={() => {}} />);
if (!html.includes('<div id="root"></div>')) throw new Error('Missing landing root in build HTML');
if ((markup.match(/<h1[ >]/g) || []).length !== 1) throw new Error('Public landing must have exactly one H1');
fs.writeFileSync('dist/index.html', html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`));
console.log('Public landing rendered into initial HTML.');
