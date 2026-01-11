//! Opportunity detection module

mod spatial;
mod statistical;
mod triangular;

pub use spatial::{detect_spatial_arbitrage, OpportunityDetector};
pub use statistical::{StatisticalArbitrageDetector, StatArbConfig, PairStatistics};
pub use triangular::{TriangularArbitrageDetector, TriangularArbConfig, TriangularPath, generate_common_paths};

