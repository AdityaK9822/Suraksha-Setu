use tiny_keccak::{Hasher, Keccak};

/// Streaming Keccak-256 (the EVM variant, matches `@noble/hashes` keccak_256
/// and Solidity `keccak256`). Never buffers the whole document.
pub struct Keccak256(Keccak);

impl Keccak256 {
    pub fn new() -> Self {
        Self(Keccak::v256())
    }
    pub fn update(&mut self, data: &[u8]) {
        self.0.update(data);
    }
    pub fn finalize(self) -> [u8; 32] {
        let mut out = [0u8; 32];
        self.0.finalize(&mut out);
        out
    }
}

impl Default for Keccak256 {
    fn default() -> Self {
        Self::new()
    }
}

pub fn hex_encode(bytes: &[u8]) -> heapless::String<64> {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut s = heapless::String::new();
    for b in bytes {
        let _ = s.push(HEX[(b >> 4) as usize] as char);
        let _ = s.push(HEX[(b & 0x0f) as usize] as char);
    }
    s
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_matches_keccak() {
        let h = Keccak256::new().finalize();
        assert_eq!(
            hex_encode(&h).as_str(),
            "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
        );
    }

    #[test]
    fn vector_matches_backend() {
        let mut h = Keccak256::new();
        h.update(b"suraksha-setu-vector");
        let out = h.finalize();
        assert_eq!(
            hex_encode(&out).as_str(),
            "eb995b53230ec2be251fb66f194c17ee41b4eaccb5dc0ea9deec188dc3595335"
        );
    }

    #[test]
    fn streaming_matches_one_shot() {
        let data = b"the quick brown fox jumps over the lazy dog";
        let mut a = Keccak256::new();
        a.update(data);
        let one = a.finalize();

        let mut b = Keccak256::new();
        for chunk in data.chunks(7) {
            b.update(chunk);
        }
        let two = b.finalize();
        assert_eq!(one, two);
    }
}
