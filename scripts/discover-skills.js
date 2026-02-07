#!/usr/bin/env node

/**
 * Skills Discovery Script
 * Reads /home/node/clawd/skills/ directory and parses SKILL.md files
 * Extracts metadata and stores in Supabase
 */

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import matter from 'gray-matter'

const SKILLS_DIR = '/home/node/clawd/skills'

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Parse SKILL.md file and extract metadata
 */
async function parseSkillFile(skillPath, skillName) {
  try {
    const skillMdPath = join(skillPath, 'SKILL.md')
    const content = await readFile(skillMdPath, 'utf-8')
    
    // Parse frontmatter
    const { data: frontmatter, content: markdown } = matter(content)
    
    // Extract metadata from frontmatter
    const name = frontmatter.name || skillName
    const description = frontmatter.description || 'No description available'
    const homepage = frontmatter.homepage || null
    
    // Parse metadata object (if it exists)
    let metadata = frontmatter.metadata || {}
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata)
      } catch (e) {
        console.warn(`⚠️  Failed to parse metadata for ${name}:`, e.message)
        metadata = {}
      }
    }
    
    const clawdbotMeta = metadata.clawdbot || {}
    const emoji = clawdbotMeta.emoji || '🔧'
    const requires = clawdbotMeta.requires || {}
    const install = clawdbotMeta.install || []
    
    return {
      name,
      description,
      emoji,
      homepage,
      status: 'not_configured',
      config: {},
      metadata: {
        markdown,
        raw: frontmatter,
        ...clawdbotMeta
      },
      requires,
      install_steps: install
    }
  } catch (error) {
    console.error(`❌ Failed to parse ${skillName}:`, error.message)
    return null
  }
}

/**
 * Discover all skills in the skills directory
 */
async function discoverSkills() {
  try {
    console.log(`🔍 Scanning ${SKILLS_DIR}...`)
    
    const entries = await readdir(SKILLS_DIR, { withFileTypes: true })
    const skillDirs = entries.filter(e => e.isDirectory())
    
    console.log(`📦 Found ${skillDirs.length} potential skills`)
    
    const skills = []
    
    for (const dir of skillDirs) {
      const skillPath = join(SKILLS_DIR, dir.name)
      const skill = await parseSkillFile(skillPath, dir.name)
      
      if (skill) {
        skills.push(skill)
        console.log(`  ✅ ${skill.emoji} ${skill.name}`)
      }
    }
    
    return skills
  } catch (error) {
    console.error('❌ Failed to discover skills:', error.message)
    throw error
  }
}

/**
 * Upsert skills into Supabase
 */
async function syncSkillsToSupabase(skills) {
  console.log(`\n💾 Syncing ${skills.length} skills to Supabase...`)
  
  for (const skill of skills) {
    try {
      // Check if skill exists
      const { data: existing } = await supabase
        .from('skills')
        .select('id, status, config')
        .eq('name', skill.name)
        .single()
      
      if (existing) {
        // Update existing skill (preserve status and config)
        const { error } = await supabase
          .from('skills')
          .update({
            description: skill.description,
            emoji: skill.emoji,
            homepage: skill.homepage,
            metadata: skill.metadata,
            requires: skill.requires,
            install_steps: skill.install_steps,
            // Preserve existing status and config
            status: existing.status,
            config: existing.config
          })
          .eq('name', skill.name)
        
        if (error) {
          console.error(`  ❌ Failed to update ${skill.name}:`, error.message)
        } else {
          console.log(`  🔄 Updated ${skill.emoji} ${skill.name}`)
        }
      } else {
        // Insert new skill
        const { error } = await supabase
          .from('skills')
          .insert(skill)
        
        if (error) {
          console.error(`  ❌ Failed to insert ${skill.name}:`, error.message)
        } else {
          console.log(`  ✨ Added ${skill.emoji} ${skill.name}`)
        }
      }
    } catch (error) {
      console.error(`  ❌ Error syncing ${skill.name}:`, error.message)
    }
  }
  
  console.log('\n✅ Sync complete!')
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 LaunchPad Skills Discovery\n')
    
    const skills = await discoverSkills()
    
    if (skills.length === 0) {
      console.log('⚠️  No skills found')
      return
    }
    
    await syncSkillsToSupabase(skills)
    
    console.log('\n📊 Summary:')
    console.log(`   Total skills: ${skills.length}`)
    console.log(`   Skills with homepage: ${skills.filter(s => s.homepage).length}`)
    console.log(`   Skills with requirements: ${skills.filter(s => Object.keys(s.requires).length > 0).length}`)
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
  }
}

main()
