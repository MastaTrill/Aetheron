// Educational Platform (Certificates/Badges)
class Education {
  constructor() {
    this.certificates = [];
  }

  issueCertificate(address, course, badge) {
    this.certificates.push({ address, course, badge, timestamp: Date.now() });
  }

  getCertificates(address) {
    return this.certificates.filter(c => c.address === address);
  }
}

module.exports = { Education };
