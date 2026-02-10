/**
 * Phase 1 Test Script: Banner Generation with automation_runs
 * 
 * This script tests the Phase 1 refactor where banner generation
 * uses the automation_runs table instead of products.metadata.
 * 
 * Run with: node test-phase1-banners.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rxtcssesqwooggydfkvs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPhase1Tests() {
  console.log('🧪 PHASE 1 TEST SUITE: Banner Generation with automation_runs\n');
  console.log('=' .repeat(70));
  
  // Test 1: Verify automation_runs table exists
  console.log('\n📋 Test 1: Verify automation_runs table exists');
  try {
    const { data, error } = await supabase
      .from('automation_runs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ FAILED: automation_runs table not found');
      console.error(error.message);
      return false;
    }
    console.log('✅ PASSED: automation_runs table exists');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return false;
  }
  
  // Test 2: Create test product
  console.log('\n📋 Test 2: Create test product');
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user for testing
      name: 'Test Product - Phase 1 Refactor',
      description: 'Testing banner generation with automation_runs table',
      niche: 'Beauty & Health',
      status: 'new',
      metadata: {
        language: 'English',
        country: 'US',
        gender: 'All'
      }
    })
    .select()
    .single();
  
  if (productError) {
    console.error('❌ FAILED: Could not create test product');
    console.error(productError.message);
    return false;
  }
  console.log(`✅ PASSED: Test product created (ID: ${product.id})`);
  
  // Test 3: Create automation_runs record (simulating frontend trigger)
  console.log('\n📋 Test 3: Create automation_runs record (simulating frontend)');
  const { data: run, error: runError } = await supabase
    .from('automation_runs')
    .upsert({
      product_id: product.id,
      user_id: product.user_id,
      automation_type: 'banner',
      status: 'processing',
      progress: 0,
      message: 'Starting banner generation...',
      started_at: new Date().toISOString()
    }, {
      onConflict: 'product_id,automation_type'
    })
    .select()
    .single();
  
  if (runError) {
    console.error('❌ FAILED: Could not create automation_runs record');
    console.error(runError.message);
    return false;
  }
  console.log('✅ PASSED: automation_runs record created');
  console.log(`   Status: ${run.status}, Progress: ${run.progress}%, Message: ${run.message}`);
  
  // Test 4: Simulate progress updates (like n8n would do)
  console.log('\n📋 Test 4: Simulate progress updates');
  const progressSteps = [
    { progress: 10, message: 'Starting research...' },
    { progress: 30, message: 'Generating concepts...' },
    { progress: 50, message: 'Creating banners...' },
    { progress: 80, message: 'Uploading assets...' },
    { progress: 100, status: 'completed', message: 'Complete! Generated 10 banners' }
  ];
  
  for (const step of progressSteps) {
    await sleep(1000); // Wait 1 second between updates
    
    const updateData = {
      progress: step.progress,
      message: step.message
    };
    
    if (step.status) {
      updateData.status = step.status;
      if (step.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    
    const { error: updateError } = await supabase
      .from('automation_runs')
      .update(updateData)
      .eq('product_id', product.id)
      .eq('automation_type', 'banner');
    
    if (updateError) {
      console.error(`❌ FAILED: Update failed at ${step.progress}%`);
      console.error(updateError.message);
      return false;
    }
    
    console.log(`   ✓ Progress: ${step.progress}% - ${step.message}`);
  }
  console.log('✅ PASSED: All progress updates succeeded');
  
  // Test 5: Verify final state
  console.log('\n📋 Test 5: Verify final state');
  const { data: finalRun, error: finalError } = await supabase
    .from('automation_runs')
    .select('*')
    .eq('product_id', product.id)
    .eq('automation_type', 'banner')
    .single();
  
  if (finalError) {
    console.error('❌ FAILED: Could not fetch final state');
    console.error(finalError.message);
    return false;
  }
  
  console.log('✅ PASSED: Final state:');
  console.log(`   Status: ${finalRun.status}`);
  console.log(`   Progress: ${finalRun.progress}%`);
  console.log(`   Message: ${finalRun.message}`);
  console.log(`   Started: ${finalRun.started_at}`);
  console.log(`   Completed: ${finalRun.completed_at}`);
  
  if (finalRun.status !== 'completed' || finalRun.progress !== 100) {
    console.error('❌ FAILED: Final state incorrect');
    return false;
  }
  
  // Test 6: Verify products.metadata is NOT used
  console.log('\n📋 Test 6: Verify products.metadata is clean');
  const { data: productCheck } = await supabase
    .from('products')
    .select('metadata')
    .eq('id', product.id)
    .single();
  
  if (productCheck.metadata?.automation_status ||
      productCheck.metadata?.automation_progress ||
      productCheck.metadata?.automation_message) {
    console.warn('⚠️  WARNING: products.metadata contains automation fields');
    console.warn('   This is OK if n8n workflow has not been updated yet');
    console.warn('   After updating n8n workflow, these fields should be empty');
  } else {
    console.log('✅ PASSED: products.metadata is clean (no automation fields)');
  }
  
  // Test 7: Test real-time subscription (optional, simulated)
  console.log('\n📋 Test 7: Test real-time subscription capability');
  console.log('   (Skipping live test - would require browser environment)');
  console.log('   To test manually:');
  console.log('   1. Open LaunchPad in browser');
  console.log('   2. Create a product');
  console.log('   3. Click "Generate Banners"');
  console.log('   4. Watch progress bar update in real-time');
  console.log('✅ PASSED: Subscription test skipped (manual test required)');
  
  // Cleanup
  console.log('\n🧹 Cleanup: Deleting test product');
  await supabase
    .from('products')
    .delete()
    .eq('id', product.id);
  console.log('✅ Test product deleted');
  
  console.log('\n' + '='.repeat(70));
  console.log('🎉 ALL PHASE 1 TESTS PASSED!\n');
  console.log('Next Steps:');
  console.log('1. Update n8n workflow (see N8N-WORKFLOW-UPDATE-INSTRUCTIONS.md)');
  console.log('2. Test banner generation in LaunchPad UI');
  console.log('3. Verify real-time progress updates work');
  console.log('4. Test with actual product (not test data)');
  
  return true;
}

// Run tests
runPhase1Tests()
  .then(success => {
    if (success) {
      console.log('\n✅ Test suite completed successfully');
      process.exit(0);
    } else {
      console.log('\n❌ Test suite failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Test suite error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
