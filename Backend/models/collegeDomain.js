import mongoose from 'mongoose';

const collegeDomainSchema = new mongoose.Schema({
  collegename: { type: String, required: true },
  domainname: { type: String, required: true },
});

const CollegeDomain = mongoose.model('CollegeDomain', collegeDomainSchema);

export default CollegeDomain;
