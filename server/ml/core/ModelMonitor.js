// Model performance monitoring
export class ModelMonitor {
  constructor() {
    this.models = null
    this.monitoringInterval = null
    this.alertThresholds = {
      maxLatency: 1000, // ms
      minAccuracy: 0.7,
      maxErrorRate: 0.05,
      maxMemoryUsage: 1024 * 1024 * 1024 // 1GB
    }
    
    this.alerts = []
  }

  startMonitoring(models) {
    this.models = models
    
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkModelHealth()
    }, 30000)
    
    console.log('✅ Model monitoring started')
  }

  async checkModelHealth() {
    if (!this.models) return

    for (const [modelName, model] of this.models) {
      const metrics = model.getMetrics()
      
      // Check latency
      if (metrics.avgLatency > this.alertThresholds.maxLatency) {
        this.createAlert('HIGH_LATENCY', modelName, {
          current: metrics.avgLatency,
          threshold: this.alertThresholds.maxLatency
        })
      }
      
      // Check error rate
      const errorRate = metrics.errorCount / Math.max(metrics.totalPredictions, 1)
      if (errorRate > this.alertThresholds.maxErrorRate) {
        this.createAlert('HIGH_ERROR_RATE', modelName, {
          current: errorRate,
          threshold: this.alertThresholds.maxErrorRate
        })
      }
      
      // Check memory usage
      if (metrics.memoryUsage > this.alertThresholds.maxMemoryUsage) {
        this.createAlert('HIGH_MEMORY_USAGE', modelName, {
          current: metrics.memoryUsage,
          threshold: this.alertThresholds.maxMemoryUsage
        })
      }
      
      // Check if model hasn't been used recently
      const hoursSinceLastUse = metrics.lastUsed 
        ? (Date.now() - metrics.lastUsed.getTime()) / (1000 * 60 * 60)
        : 999
      
      if (hoursSinceLastUse > 24) {
        this.createAlert('MODEL_UNUSED', modelName, {
          hoursSinceLastUse
        })
      }
    }
    
    // Log metrics to database
    await this.logMetrics()
  }

  createAlert(type, modelName, data) {
    const alert = {
      id: `${type}_${modelName}_${Date.now()}`,
      type,
      modelName,
      severity: this.getAlertSeverity(type),
      message: this.getAlertMessage(type, modelName, data),
      data,
      timestamp: new Date(),
      acknowledged: false
    }
    
    this.alerts.push(alert)
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
    
    console.warn(`🚨 Model Alert: ${alert.message}`)
    
    // Send to monitoring system
    this.sendAlert(alert)
  }

  getAlertSeverity(type) {
    const severityMap = {
      'HIGH_LATENCY': 'medium',
      'HIGH_ERROR_RATE': 'high',
      'HIGH_MEMORY_USAGE': 'medium',
      'MODEL_UNUSED': 'low',
      'MODEL_FAILURE': 'critical'
    }
    
    return severityMap[type] || 'medium'
  }

  getAlertMessage(type, modelName, data) {
    switch (type) {
      case 'HIGH_LATENCY':
        return `Model ${modelName} has high latency: ${data.current}ms (threshold: ${data.threshold}ms)`
      
      case 'HIGH_ERROR_RATE':
        return `Model ${modelName} has high error rate: ${(data.current * 100).toFixed(2)}% (threshold: ${(data.threshold * 100).toFixed(2)}%)`
      
      case 'HIGH_MEMORY_USAGE':
        return `Model ${modelName} using ${Math.round(data.current / 1024 / 1024)}MB memory (threshold: ${Math.round(data.threshold / 1024 / 1024)}MB)`
      
      case 'MODEL_UNUSED':
        return `Model ${modelName} hasn't been used for ${data.hoursSinceLastUse.toFixed(1)} hours`
      
      default:
        return `Model ${modelName} alert: ${type}`
    }
  }

  async sendAlert(alert) {
    try {
      // Store alert in database
      const supabase = serverSupabaseServiceRole()
      
      await supabase
        .from('ml_alerts')
        .insert({
          alert_type: alert.type,
          severity: alert.severity,
          title: `Model Alert: ${alert.modelName}`,
          description: alert.message,
          metric_name: alert.type,
          current_value: alert.data.current,
          threshold_value: alert.data.threshold
        })
      
      // Send to external monitoring (Slack, email, etc.)
      if (alert.severity === 'critical' || alert.severity === 'high') {
        await this.sendExternalAlert(alert)
      }
      
    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  async sendExternalAlert(alert) {
    // Send to Slack, email, or other external systems
    // Implementation depends on your notification setup
    console.log('🚨 CRITICAL ALERT:', alert.message)
  }

  async logMetrics() {
    if (!this.models) return

    try {
      const supabase = serverSupabaseServiceRole()
      const metrics = []
      
      for (const [modelName, model] of this.models) {
        const modelMetrics = model.getMetrics()
        
        metrics.push({
          model_name: modelName,
          model_version: model.version,
          total_predictions: modelMetrics.totalPredictions,
          avg_latency: modelMetrics.avgLatency,
          error_count: modelMetrics.errorCount,
          memory_usage: modelMetrics.memoryUsage,
          last_used: modelMetrics.lastUsed
        })
      }
      
      if (metrics.length > 0) {
        await supabase
          .from('model_performance')
          .insert(metrics)
      }
      
    } catch (error) {
      console.error('Failed to log metrics:', error)
    }
  }

  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged)
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      alert.acknowledgedAt = new Date()
    }
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    console.log('Model monitoring stopped')
  }
}
