use criterion::{black_box, criterion_group, criterion_main, Criterion};
use solana_price_monitor::calculator::{calculate_amm_price, calculate_output_amount};

fn price_calculation_benchmark(c: &mut Criterion) {
    c.bench_function("calculate_amm_price", |b| {
        b.iter(|| {
            calculate_amm_price(
                black_box(1_000_000_000_000),
                black_box(100_000_000_000),
                black_box(9),
                black_box(6),
            )
        });
    });

    c.bench_function("calculate_output_amount", |b| {
        b.iter(|| {
            calculate_output_amount(
                black_box(1_000_000_000),
                black_box(100_000_000_000_000),
                black_box(10_000_000_000_000),
                black_box(0.003),
            )
        });
    });
}

criterion_group!(benches, price_calculation_benchmark);
criterion_main!(benches);
