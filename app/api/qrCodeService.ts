// QR Code Service using PostgreSQL directly
import { query as dbQuery } from '@/lib/db'

export interface QRCode {
  id: string
  name: string
  type: "url" | "text" | "email" | "phone" | "wifi" | "location"
  content: string
  isDynamic: boolean
  tags: string[]
  scans: number
  isActive: boolean
  expiresAt?: string
  maxScans?: number
  qrCodeData: string
  customization: QRCodeCustomization
  userId: string
  categoryId?: string
  category?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface QRCodeCustomization {
  color?: string
  size?: number
  margin?: number
  format?: "png" | "svg" | "pdf"
  foregroundColor?: string
  backgroundColor?: string
  logoSize?: number
  cornerRadius?: number
}

export interface QRCodeCreateData {
  name: string
  type: "url" | "text" | "email" | "phone" | "wifi" | "location"
  content: string
  isDynamic?: boolean
  categoryId?: string
  tags?: string[]
  customization?: QRCodeCustomization
  expiresAt?: string
  maxScans?: number
}

export interface QRCodeUpdateData {
  name?: string
  content?: string
  isDynamic?: boolean
  categoryId?: string
  tags?: string[]
  customization?: QRCodeCustomization
  isActive?: boolean
  expiresAt?: string
  maxScans?: number
}

export interface QRCodeListParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  categoryId?: string
  isActive?: boolean
  userId?: string
  sortBy?: 'newest' | 'oldest' | 'most_scanned' | 'least_scanned' | 'name_asc' | 'name_desc'
}

class QRCodeService {
  // Get QR codes with pagination and filters
  async getQRCodes(params: QRCodeListParams = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        search,
        type,
        categoryId,
        isActive,
        userId,
        sortBy = 'newest'
      } = params

      const offset = (page - 1) * limit
      const conditions: string[] = []
      const values: any[] = []
      let paramIndex = 1

      // Build WHERE conditions
      if (search) {
        conditions.push(`(q.name ILIKE $${paramIndex} OR q.content ILIKE $${paramIndex})`)
        values.push(`%${search}%`)
        paramIndex++
      }

      if (type) {
        conditions.push(`q.type = $${paramIndex}`)
        values.push(type)
        paramIndex++
      }

      if (categoryId) {
        conditions.push(`q.category_id = $${paramIndex}`)
        values.push(categoryId)
        paramIndex++
      }

      if (isActive !== undefined) {
        conditions.push(`q.is_active = $${paramIndex}`)
        values.push(isActive)
        paramIndex++
      }

      if (userId) {
        conditions.push(`q.user_id = $${paramIndex}`)
        values.push(userId)
        paramIndex++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // Build ORDER BY clause based on sortBy parameter
      let orderByClause = ''
      switch (sortBy) {
        case 'newest':
          orderByClause = 'ORDER BY q.created_at DESC'
          break
        case 'oldest':
          orderByClause = 'ORDER BY q.created_at ASC'
          break
        case 'most_scanned':
          orderByClause = 'ORDER BY q.scans DESC, q.created_at DESC'
          break
        case 'least_scanned':
          orderByClause = 'ORDER BY q.scans ASC, q.created_at DESC'
          break
        case 'name_asc':
          orderByClause = 'ORDER BY q.name ASC'
          break
        case 'name_desc':
          orderByClause = 'ORDER BY q.name DESC'
          break
        default:
          orderByClause = 'ORDER BY q.created_at DESC'
      }

      // Main query
      const query = `
        SELECT 
          q.*,
          c.name as category_name
        FROM qr_codes q
        LEFT JOIN qr_categories c ON q.category_id = c.category_id
        ${whereClause}
        ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM qr_codes q
        ${whereClause}
      `

      values.push(limit, offset)
      const countValues = values.slice(0, paramIndex - 1)

      const [result, countResult] = await Promise.all([
        dbQuery(query, values),
        dbQuery(countQuery, countValues)
      ])

      const total = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(total / limit)

      return {
        qrCodes: result.rows.map(row => this.formatQRCode(row)),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    } catch (error: any) {
      console.error("Error fetching QR codes:", error)
      throw new Error(error.message || "Failed to fetch QR codes")
    }
  }

  // Create new QR code
  async createQRCode(data: QRCodeCreateData, userId: string) {
    try {
      const query = `
        INSERT INTO qr_codes (
          id, user_id, name, type, content, is_dynamic, category_id, 
          tags, customization, expires_at, max_scans, qr_code_data, 
          is_active, scans, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, 0, NOW(), NOW()
        ) RETURNING *
      `

      const values = [
        userId,
        data.name,
        data.type,
        data.content,
        data.isDynamic || false,
        data.categoryId || null,
        JSON.stringify(data.tags || []),
        JSON.stringify(data.customization || {}),
        data.expiresAt || null,
        data.maxScans || null,
        `qr_${Date.now()}` // Placeholder for QR code data
      ]

      const result = await dbQuery(query, values)
      return this.formatQRCode(result.rows[0])
    } catch (error: any) {
      console.error("Error creating QR code:", error)
      throw new Error(error.message || "Failed to create QR code")
    }
  }

  // Get QR code by ID
  async getQRCodeById(id: string, userId?: string) {
    try {
      let query = `
        SELECT 
          q.*,
          c.name as category_name
        FROM qr_codes q
        LEFT JOIN qr_categories c ON q.category_id = c.category_id
        WHERE q.id = $1
      `
      const values = [id]

      if (userId) {
        query += ` AND q.user_id = $2`
        values.push(userId)
      }

      const result = await dbQuery(query, values)
      
      if (result.rows.length === 0) {
        throw new Error("QR code not found")
      }

      return this.formatQRCode(result.rows[0])
    } catch (error: any) {
      console.error("Error fetching QR code:", error)
      throw new Error(error.message || "Failed to fetch QR code")
    }
  }

  // Update QR code
  async updateQRCode(id: string, data: QRCodeUpdateData, userId: string) {
    try {
      const updates: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex}`)
        values.push(data.name)
        paramIndex++
      }

      if (data.content !== undefined) {
        updates.push(`content = $${paramIndex}`)
        values.push(data.content)
        paramIndex++
      }

      if (data.isDynamic !== undefined) {
        updates.push(`is_dynamic = $${paramIndex}`)
        values.push(data.isDynamic)
        paramIndex++
      }

      if (data.categoryId !== undefined) {
        updates.push(`category_id = $${paramIndex}`)
        values.push(data.categoryId)
        paramIndex++
      }

      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex}`)
        values.push(JSON.stringify(data.tags))
        paramIndex++
      }

      if (data.customization !== undefined) {
        updates.push(`customization = $${paramIndex}`)
        values.push(JSON.stringify(data.customization))
        paramIndex++
      }

      if (data.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`)
        values.push(data.isActive)
        paramIndex++
      }

      if (data.expiresAt !== undefined) {
        updates.push(`expires_at = $${paramIndex}`)
        values.push(data.expiresAt)
        paramIndex++
      }

      if (data.maxScans !== undefined) {
        updates.push(`max_scans = $${paramIndex}`)
        values.push(data.maxScans)
        paramIndex++
      }

      if (updates.length === 0) {
        throw new Error("No valid fields to update")
      }

      updates.push(`updated_at = NOW()`)
      values.push(id, userId)

      const query = `
        UPDATE qr_codes 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `

      const result = await dbQuery(query, values)

      if (result.rows.length === 0) {
        throw new Error("QR code not found or access denied")
      }

      return this.formatQRCode(result.rows[0])
    } catch (error: any) {
      console.error("Error updating QR code:", error)
      throw new Error(error.message || "Failed to update QR code")
    }
  }

  // Delete QR code
  async deleteQRCode(id: string, userId: string) {
    try {
      const query = `
        DELETE FROM qr_codes 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `
      
      const result = await dbQuery(query, [id, userId])

      if (result.rows.length === 0) {
        throw new Error("QR code not found or access denied")
      }

      return { success: true, message: "QR code deleted successfully" }
    } catch (error: any) {
      console.error("Error deleting QR code:", error)
      throw new Error(error.message || "Failed to delete QR code")
    }
  }

  // Increment scan count
  async incrementScanCount(id: string) {
    try {
      const query = `
        UPDATE qr_codes 
        SET scans = scans + 1, updated_at = NOW()
        WHERE id = $1 AND is_active = true
        RETURNING scans
      `
      
      const result = await dbQuery(query, [id])

      if (result.rows.length === 0) {
        throw new Error("QR code not found or inactive")
      }

      return { scans: result.rows[0].scans }
    } catch (error: any) {
      console.error("Error incrementing scan count:", error)
      throw new Error(error.message || "Failed to update scan count")
    }
  }

  // Helper method to format QR code data
  private formatQRCode(row: any): QRCode {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      content: row.content,
      isDynamic: row.is_dynamic,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      scans: row.scans || 0,
      isActive: row.is_active,
      expiresAt: row.expires_at,
      maxScans: row.max_scans,
      qrCodeData: row.qr_code_data,
      customization: typeof row.customization === 'string' ? JSON.parse(row.customization) : row.customization || {},
      userId: row.user_id,
      categoryId: row.category_id,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name
      } : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

// Export singleton instance
export const qrCodeService = new QRCodeService()
export default qrCodeService
