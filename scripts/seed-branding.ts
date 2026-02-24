import { prisma } from '@/lib/prisma'

async function main() {
  const defaults = [
    { category: 'branding', setting_key: 'site_name', value: 'Scanly', description: 'Displayed site name' },
    { category: 'branding', setting_key: 'logo', value: '', description: 'Logo URL (PNG/SVG/JPG) displayed in header' }
  ]
  const now = new Date()
  for (const d of defaults) {
    await prisma.system_settings.upsert({
      where: { category_setting_key: { category: d.category, setting_key: d.setting_key } },
      create: {
        category: d.category,
        setting_key: d.setting_key,
        setting_value: d.value,
        description: d.description,
        data_type: 'string',
        created_at: now,
        updated_at: now,
        is_active: true
      },
      update: {
        setting_value: d.value,
        description: d.description,
        updated_at: now
      }
    })
  }
  console.log('Branding settings seeded/updated')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
