//! Health check utilities

use serde::Serialize;

/// Health status of the system
#[derive(Debug, Clone, Serialize)]
pub struct HealthStatus {
    pub healthy: bool,
    pub cache_entries: usize,
    pub websocket_connected: bool,
    pub last_update_ms: u64,
    pub uptime_seconds: u64,
}

impl HealthStatus {
    pub fn new() -> Self {
        Self {
            healthy: true,
            cache_entries: 0,
            websocket_connected: false,
            last_update_ms: 0,
            uptime_seconds: 0,
        }
    }
}

impl Default for HealthStatus {
    fn default() -> Self {
        Self::new()
    }
}

/// Perform health check
pub fn check_health(
    cache_entries: usize,
    websocket_connected: bool,
    last_update_ms: u64,
    uptime_seconds: u64,
) -> HealthStatus {
    let stale_threshold = 5000; // 5 seconds

    let healthy = websocket_connected && last_update_ms < stale_threshold;

    HealthStatus {
        healthy,
        cache_entries,
        websocket_connected,
        last_update_ms,
        uptime_seconds,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_check() {
        let status = check_health(10, true, 100, 3600);
        assert!(status.healthy);
        assert_eq!(status.cache_entries, 10);
    }

    #[test]
    fn test_unhealthy_when_disconnected() {
        let status = check_health(0, false, 100, 60);
        assert!(!status.healthy);
    }
}
