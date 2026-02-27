#!/usr/bin/env node

/**
 * Apollo CLI
 * A friendly command-line interface for the Apollo Dashboard
 * 
 * No external dependencies - uses only Node.js built-ins
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Regular colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Bright colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Background
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};

// Helper functions for colored output
const c = {
  primary: (text) => `${colors.brightCyan}${text}${colors.reset}`,
  secondary: (text) => `${colors.brightMagenta}${text}${colors.reset}`,
  success: (text) => `${colors.brightGreen}${text}${colors.reset}`,
  warning: (text) => `${colors.brightYellow}${text}${colors.reset}`,
  error: (text) => `${colors.brightRed}${text}${colors.reset}`,
  dim: (text) => `${colors.dim}${text}${colors.reset}`,
  bold: (text) => `${colors.bold}${text}${colors.reset}`,
  url: (text) => `${colors.bold}${colors.brightCyan}${text}${colors.reset}`,
};

// ASCII Art Logo - Apollo inspired
const logo = `
${colors.brightCyan}                    ▄▄▄▄▄▄▄▄▄▄▄                    
              ▄▄████████████████████▄▄              
          ▄▄██████████████████████████████▄▄          
        ▄████████████████████████████████████▄        
      ▄██████████████████████████████████████████▄      
    ▄████████████████████▀▀▀▀████████████████████████▄    
   ███████████████████▀        ▀███████████████████████   
  █████████████████▀    ${colors.brightMagenta}▄████▄${colors.brightCyan}    ▀█████████████████████  
 ████████████████▀    ${colors.brightMagenta}▄████████▄${colors.brightCyan}    ▀████████████████████ 
 ███████████████    ${colors.brightMagenta}▄██████████████▄${colors.brightCyan}    ███████████████████ 
████████████████   ${colors.brightMagenta}████████████████████${colors.brightCyan}   ████████████████████
████████████████   ${colors.brightMagenta}████████████████████${colors.brightCyan}   ████████████████████
 ███████████████    ${colors.brightMagenta}▀██████████████▀${colors.brightCyan}    ███████████████████ 
 ████████████████▄    ${colors.brightMagenta}▀████████▀${colors.brightCyan}    ▄████████████████████ 
  █████████████████▄    ${colors.brightMagenta}▀████▀${colors.brightCyan}    ▄█████████████████████  
   ███████████████████▄        ▄███████████████████████   
    ▀████████████████████▄▄▄▄████████████████████████▀    
      ▀██████████████████████████████████████████████▀      
        ▀████████████████████████████████████████▀        
          ▀▀██████████████████████████████████▀▀          
              ▀▀████████████████████████▀▀              
                    ▀▀▀▀▀▀▀▀▀▀▀                    ${colors.reset}
`;

// Simpler ASCII logo for terminals that don't support unicode well
const logoSimple = `
${colors.brightCyan}           _____          
          /     \\         
         /       \\        
        /  ${colors.brightMagenta}*****${colors.brightCyan}  \\       
       /  ${colors.brightMagenta}*******${colors.brightCyan}  \\      
      /  ${colors.brightMagenta}*********${colors.brightCyan}  \\     
     /   ${colors.brightMagenta}*********${colors.brightCyan}   \\    
    /     ${colors.brightMagenta}*******${colors.brightCyan}     \\   
   /       ${colors.brightMagenta}*****${colors.brightCyan}       \\  
  /         ${colors.brightMagenta}***${colors.brightCyan}         \\ 
 /           ${colors.brightMagenta}*${colors.brightCyan}           \\
/___________________________\\${colors.reset}
`;

// Text-based logo (most compatible)
const logoText = `
${colors.brightCyan}    ___    ____  ____  __    __    ____ 
   /   |  / __ \\/ __ \\/ /   / /   / __ \\
  / /| | / /_/ / / / / /   / /   / / / /
 / ___ |/ ____/ /_/ / /___/ /___/ /_/ / 
/_/  |_/_/    \\____/_____/_____/\\____/  ${colors.reset}
`;

function showLogo() {
  // Use the text logo for maximum compatibility
  console.log(logoText);
  console.log(c.dim('  Local-first Integrated Design Environment'));
  console.log('');
}

function showWelcome() {
  showLogo();
  console.log(`  ${c.success('✓')} Welcome to ${c.bold('Apollo')}!`);
  console.log('');
}

function showHelp() {
  showLogo();
  
  console.log(c.bold('  Usage:'));
  console.log(`    ${c.primary('apollo')} ${c.dim('<command>')} ${c.dim('[options]')}`);
  console.log('');
  
  console.log(c.bold('  Commands:'));
  console.log(`    ${c.primary('start')}         Start the Apollo development server`);
  console.log(`    ${c.primary('build')}         Build Apollo for production`);
  console.log(`    ${c.primary('server')}        Start only the backend server`);
  console.log(`    ${c.primary('help')}          Show this help message`);
  console.log(`    ${c.primary('version')}       Show version information`);
  console.log('');
  
  console.log(c.bold('  Examples:'));
  console.log(`    ${c.dim('$')} apollo start       ${c.dim('# Start development server')}`);
  console.log(`    ${c.dim('$')} apollo build       ${c.dim('# Build for production')}`);
  console.log('');
  
  console.log(c.dim('  For more information, visit the docs at docs/QUICKSTART.md'));
  console.log('');
}

function showVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`${c.primary('Apollo')} ${c.bold(pkg.version)}`);
  } catch (e) {
    console.log(`${c.primary('Apollo')} ${c.bold('1.0.0')}`);
  }
}

function runNpmScript(scriptName, description) {
  showWelcome();
  
  console.log(`  ${c.primary('→')} ${description}...`);
  console.log('');
  
  const isStart = scriptName === 'dev';
  
  if (isStart) {
    console.log(`  ${c.dim('┌─────────────────────────────────────────────────┐')}`);
    console.log(`  ${c.dim('│')}                                                 ${c.dim('│')}`);
    console.log(`  ${c.dim('│')}  ${c.success('●')} Server will be available at:                 ${c.dim('│')}`);
    console.log(`  ${c.dim('│')}    ${c.url('http://localhost:1225')}                      ${c.dim('│')}`);
    console.log(`  ${c.dim('│')}                                                 ${c.dim('│')}`);
    console.log(`  ${c.dim('│')}  ${c.warning('⚡')} Hot reload enabled                           ${c.dim('│')}`);
    console.log(`  ${c.dim('│')}  ${c.dim('Press')} ${c.bold('Ctrl+C')} ${c.dim('to stop')}                            ${c.dim('│')}`);
    console.log(`  ${c.dim('│')}                                                 ${c.dim('│')}`);
    console.log(`  ${c.dim('└─────────────────────────────────────────────────┘')}`);
    console.log('');
  }
  
  // Get the project root directory
  const projectRoot = path.join(__dirname, '..');
  
  // Spawn npm with the script
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['run', scriptName], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  
  child.on('error', (error) => {
    console.error(c.error(`  ✗ Failed to start: ${error.message}`));
    process.exit(1);
  });
  
  child.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log('');
      console.log(c.error(`  ✗ Process exited with code ${code}`));
    }
    process.exit(code || 0);
  });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('');
    console.log('');
    console.log(`  ${c.dim('Shutting down Apollo...')}`);
    console.log(`  ${c.success('✓')} Goodbye! ${c.dim('See you next time.')}`);
    console.log('');
    child.kill('SIGINT');
  });
}

// Main CLI logic
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  if (command === 'version' || command === '--version' || command === '-v') {
    showVersion();
    return;
  }
  
  switch (command) {
    case 'start':
    case 'dev':
      runNpmScript('dev', 'Starting Apollo development server');
      break;
      
    case 'build':
      runNpmScript('build', 'Building Apollo for production');
      break;
      
    case 'server':
      runNpmScript('server', 'Starting Apollo backend server');
      break;
      
    default:
      console.log('');
      console.log(c.error(`  ✗ Unknown command: ${command}`));
      console.log('');
      console.log(`  Run ${c.primary('apollo help')} to see available commands.`);
      console.log('');
      process.exit(1);
  }
}

main();
