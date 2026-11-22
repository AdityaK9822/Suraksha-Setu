use tiny_keccak::{Hasher, Sha3};

/// Streaming NIST SHA3-256, matching the backend's `createHash('sha3-256')`
/// and the SHA-3 spec. Never buffers the whole document.
pub struct Sha3_256(Sha3);

impl Sha3_256 {
    pub fn new() -> Self {
        Self(Sha3::v256())
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

impl Default for Sha3_256 {
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
    fn empty_matches_sha3() {
        let h = Sha3_256::new().finalize();
        assert_eq!(
            hex_encode(&h).as_str(),
            "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
        );
    }

    #[test]
    fn vector_matches_backend() {
        let mut h = Sha3_256::new();
        h.update(b"suraksha-setu-vector");
        let out = h.finalize();
        assert_eq!(
            hex_encode(&out).as_str(),
            "8ff8d57cf22d193a4afbe6eb9242261719830e077791437977cebe28ae052c0c"
        );
    }

    #[test]
    fn streaming_matches_one_shot() {
        let data = b"the quick brown fox jumps over the lazy dog";
        let mut a = Sha3_256::new();
        a.update(data);
        let one = a.finalize();

        let mut b = Sha3_256::new();
        for chunk in data.chunks(7) {
            b.update(chunk);
        }
        let two = b.finalize();
        assert_eq!(one, two);
    }
}
