// API endpoint to reload specific models
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    if (!user.is_admin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const body = await readBody(event)
    const { modelName, force = false } = body

    if (!modelName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Model name is required'
      })
    }

    // Get ML service instance
    const mlService = global.mlServiceInstance
    if (!mlService) {
      throw createError({
        statusCode: 503,
        statusMessage: 'ML service not initialized'
      })
    }

    // Reload the model
    await mlService.modelServing.reloadModel(modelName)
    
    // Log the reload action
    const supabase = serverSupabaseServiceRole(event)
    await supabase
      .from('ml_alerts')
      .insert({
        alert_type: 'MODEL_RELOAD',
        severity: 'low',
        title: `Model Reloaded: ${modelName}`,
        description: `Model ${modelName} was manually reloaded by ${user.email}`,
        status: 'resolved'
      })

    return {
      success: true,
      message: `Model ${modelName} reloaded successfully`,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Model reload error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to reload model: ${error.message}`
    })
  }
})
