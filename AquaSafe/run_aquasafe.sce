// ================================================================
// run_aquasafe.sce  —  AquaSafe Launch Script
// Written by Krishna | FOSSEE Scilab GUIVerse Hackathon 2026
//
// Run this file to start AquaSafe:
//   In Scilab console:  exec('E:\My projects\Task\AquaSafe\run_aquasafe.sce')
// ================================================================

clc;
clear;

// I use get_absolute_file_path so the script works from any directory
this_dir = get_absolute_file_path('run_aquasafe.sce');

disp('=== AquaSafe — Loading... ===');

// Load the engine first — it defines the WQI formula, all callbacks and charts
exec(this_dir + 'aquasafe_engine.sci', -1);
disp('  [OK] Engine loaded');

exec(this_dir + 'AquaSafe.sci', -1);
disp('  [OK] GUI loaded');

disp('=== Launching AquaSafe... ===');
AquaSafe();
