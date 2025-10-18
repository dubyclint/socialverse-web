<!-- components/VerificationApplicationModal.vue -->
<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Verification Application</h2>
        <button @click="$emit('close')" class="close-btn">
          <Icon name="x" size="20" />
        </button>
      </div>
      
      <div class="verification-container">
        <!-- Verification Type Selection -->
        <div v-if="step === 1" class="step-content">
          <h3>Choose Verification Type</h3>
          <p class="step-description">Select the type of verification you want to apply for</p>
          
          <div class="verification-types">
            <div
              v-for="type in verificationTypes"
              :key="type.key"
              @click="selectVerificationType(type.key)"
              class="verification-type-card"
              :class="{ selected: selectedType === type.key }"
            >
              <div class="type-icon">
                <Icon :name="type.icon" size="32" />
              </div>
              <h4>{{ type.name }}</h4>
              <p>{{ type.description }}</p>
              <div class="type-features">
                <div
                  v-for="feature in type.features"
                  :key="feature"
                  class="feature-item"
                >
                  <Icon name="check" size="14" />
                  <span>{{ feature }}</span>
                </div>
              </div>
              <div class="type-badge" :class="`badge-${type.key}`">
                {{ type.badge }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Basic Information -->
        <div v-if="step === 2" class="step-content">
          <h3>Basic Information</h3>
          <p class="step-description">Provide your basic identification information</p>
          
          <form class="verification-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Full Legal Name <span class="required">*</span></label>
                <input
                  v-model="formData.fullName"
                  type="text"
                  class="form-input"
                  placeholder="Enter your full legal name"
                  required
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Government ID Type <span class="required">*</span></label>
                <select v-model="formData.idType" class="form-select" required>
                  <option value="">Select ID type</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="national_id">National ID Card</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">ID Number <span class="required">*</span></label>
                <input
                  v-model="formData.idNumber"
                  type="text"
                  class="form-input"
                  placeholder="Enter your ID number"
                  required
                />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Government ID Document <span class="required">*</span></label>
              <div class="file-upload-area">
                <input
                  ref="idDocumentInput"
                  type="file"
                  accept="image/*,.pdf"
                  @change="handleIdDocumentUpload"
                  class="file*
                  class="file-input"
                />
                <div class="upload-content">
                  <Icon name="upload" size="32" />
                  <p>Upload a clear photo of your government ID</p>
                  <p class="upload-note">Accepted formats: JPG, PNG, PDF (Max 10MB)</p>
                  <button
                    type="button"
                    @click="$refs.idDocumentInput.click()"
                    class="upload-btn"
                  >
                    Choose File
                  </button>
                </div>
              </div>
              
              <div v-if="formData.idDocumentFile" class="uploaded-file">
                <Icon name="file" size="20" />
                <span>{{ formData.idDocumentFile.name }}</span>
                <button
                  type="button"
                  @click="removeIdDocument"
                  class="remove-file-btn"
                >
                  <Icon name="x" size="16" />
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <!-- Address Information (K2 Levels) -->
        <div v-if="step === 3 && needsAddressInfo" class="step-content">
          <h3>Address Information</h3>
          <p class="step-description">Provide your current residential address for K2 verification</p>
          
          <form class="verification-form">
            <div class="form-group">
              <label class="form-label">Address Line 1 <span class="required">*</span></label>
              <input
                v-model="formData.addressLine1"
                type="text"
                class="form-input"
                placeholder="Street address, P.O. box, company name"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Address Line 2</label>
              <input
                v-model="formData.addressLine2"
                type="text"
                class="form-input"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">City <span class="required">*</span></label>
                <input
                  v-model="formData.city"
                  type="text"
                  class="form-input"
                  placeholder="City"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">State/Province <span class="required">*</span></label>
                <input
                  v-model="formData.stateProvince"
                  type="text"
                  class="form-input"
                  placeholder="State or Province"
                  required
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Postal Code <span class="required">*</span></label>
                <input
                  v-model="formData.postalCode"
                  type="text"
                  class="form-input"
                  placeholder="Postal/ZIP code"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Country <span class="required">*</span></label>
                <select v-model="formData.country" class="form-select" required>
                  <option value="">Select country</option>
                  <option v-for="country in countries" :key="country" :value="country">
                    {{ country }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Proof of Address <span class="required">*</span></label>
              <div class="file-upload-area">
                <input
                  ref="proofOfAddressInput"
                  type="file"
                  accept="image/*,.pdf"
                  @change="handleProofOfAddressUpload"
                  class="file-input"
                />
                <div class="upload-content">
                  <Icon name="upload" size="32" />
                  <p>Upload a recent utility bill, bank statement, or lease agreement</p>
                  <p class="upload-note">Document must be dated within the last 3 months</p>
                  <button
                    type="button"
                    @click="$refs.proofOfAddressInput.click()"
                    class="upload-btn"
                  >
                    Choose File
                  </button>
                </div>
              </div>
              
              <div v-if="formData.proofOfAddressFile" class="uploaded-file">
                <Icon name="file" size="20" />
                <span>{{ formData.proofOfAddressFile.name }}</span>
                <button
                  type="button"
                  @click="removeProofOfAddress"
                  class="remove-file-btn"
                >
                  <Icon name="x" size="16" />
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <!-- Business Information -->
        <div v-if="step === 3 && selectedType === 'business'" class="step-content">
          <h3>Business Information</h3>
          <p class="step-description">Provide your business registration details</p>
          
          <form class="verification-form">
            <div class="form-group">
              <label class="form-label">Business Name <span class="required">*</span></label>
              <input
                v-model="formData.businessName"
                type="text"
                class="form-input"
                placeholder="Legal business name"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Business Registration Number <span class="required">*</span></label>
              <input
                v-model="formData.businessRegNumber"
                type="text"
                class="form-input"
                placeholder="Registration/Tax ID number"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Business Registration Document <span class="required">*</span></label>
              <div class="file-upload-area">
                <input
                  ref="businessDocumentInput"
                  type="file"
                  accept="image/*,.pdf"
                  @change="handleBusinessDocumentUpload"
                  class="file-input"
                />
                <div class="upload-content">
                  <Icon name="upload" size="32" />
                  <p>Upload business registration certificate or incorporation documents</p>
                  <button
                    type="button"
                    @click="$refs.businessDocumentInput.click()"
                    class="upload-btn"
                  >
                    Choose File
                  </button>
                </div>
              </div>
              
              <div v-if="formData.businessDocumentFile" class="uploaded-file">
                <Icon name="file" size="20" />
                <span>{{ formData.businessDocumentFile.name }}</span>
                <button
                  type="button"
                  @click="removeBusinessDocument"
                  class="remove-file-btn"
                >
                  <Icon name="x" size="16" />
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <!-- Additional Documents -->
        <div v-if="step === 4" class="step-content">
          <h3>Additional Documents (Optional)</h3>
          <p class="step-description">Upload any additional supporting documents to strengthen your application</p>
          
          <div class="additional-documents">
            <div class="file-upload-area multiple">
              <input
                ref="additionalDocsInput"
                type="file"
                accept="image/*,.pdf"
                multiple
                @change="handleAdditionalDocsUpload"
                class="file-input"
              />
              <div class="upload-content">
                <Icon name="upload" size="32" />
                <p>Upload additional supporting documents</p>
                <p class="upload-note">Such as professional licenses, certificates, or other credentials</p>
                <button
                  type="button"
                  @click="$refs.additionalDocsInput.click()"
                  class="upload-btn"
                >
                  Choose Files
                </button>
              </div>
            </div>
            
            <div v-if="formData.additionalDocuments.length > 0" class="uploaded-files">
              <div
                v-for="(file, index) in formData.additionalDocuments"
                :key="index"
                class="uploaded-file"
              >
                <Icon name="file" size="20" />
                <span>{{ file.name }}</span>
                <button
                  type="button"
                  @click="removeAdditionalDocument(index)"
                  class="remove-file-btn"
                >
                  <Icon name="x" size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Review and Submit -->
        <div v-if="step === 5" class="step-content">
          <h3>Review Your Application</h3>
          <p class="step-description">Please review all information before submitting your verification application</p>
          
          <div class="review-section">
            <div class="review-item">
              <h4>Verification Type</h4>
              <p>{{ getVerificationTypeName(selectedType) }}</p>
            </div>
            
            <div class="review-item">
              <h4>Personal Information</h4>
              <p><strong>Name:</strong> {{ formData.fullName }}</p>
              <p><strong>ID Type:</strong> {{ formatIdType(formData.idType) }}</p>
              <p><strong>ID Number:</strong> {{ formData.idNumber }}</p>
            </div>
            
            <div v-if="needsAddressInfo" class="review-item">
              <h4>Address Information</h4>
              <p>{{ formData.addressLine1 }}</p>
              <p v-if="formData.addressLine2">{{ formData.addressLine2 }}</p>
              <p>{{ formData.city }}, {{ formData.stateProvince }} {{ formData.postalCode }}</p>
              <p>{{ formData.country }}</p>
            </div>
            
            <div v-if="selectedType === 'business'" class="review-item">
              <h4>Business Information</h4>
              <p><strong>Business Name:</strong> {{ formData.businessName }}</p>
              <p><strong>Registration Number:</strong> {{ formData.businessRegNumber }}</p>
            </div>
            
            <div class="review-item">
              <h4>Uploaded Documents</h4>
              <ul class="document-list">
                <li v-if="formData.idDocumentFile">
                  <Icon name="file" size="16" />
                  Government ID: {{ formData.idDocumentFile.name }}
                </li>
                <li v-if="formData.proofOfAddressFile">
                  <Icon name="file" size="16" />
                  Proof of Address: {{ formData.proofOfAddressFile.name }}
                </li>
                <li v-if="formData.businessDocumentFile">
                  <Icon name="file" size="16" />
                  Business Document: {{ formData.businessDocumentFile.name }}
                </li>
                <li v-for="(doc, index) in formData.additionalDocuments" :key="index">
                  <Icon name="file" size="16" />
                  Additional Document: {{ doc.name }}
                </li>
              </ul>
            </div>
          </div>
          
          <div class="terms-agreement">
            <label class="checkbox-label">
              <input
                v-model="agreedToTerms"
                type="checkbox"
                required
              />
              <span class="checkmark"></span>
              I agree to the <a href="/terms" target="_blank">Terms of Service</a> and 
              <a href="/privacy" target="_blank">Privacy Policy</a>, and I confirm that all 
              information provided is accurate and truthful.
            </label>
          </div>
        </div>
      </div>
      
      <!-- Navigation -->
      <div class="modal-footer">
        <div class="step-indicator">
          <div
            v-for="stepNum in totalSteps"
            :key="stepNum"
            class="step-dot"
            :class="{ 
              active: stepNum === step, 
              completed: stepNum < step 
            }"
          >
            <Icon v-if="stepNum < step" name="check" size="12" />
            <span v-else>{{ stepNum }}</span>
          </div>
        </div>
        
        <div class="navigation-buttons">
          <button
            v-if="step > 1"
            @click="previousStep"
            class="btn btn-secondary"
          >
            <Icon name="chevron-left" size="16" />
            Previous
          </button>
          
          <button
            v-if="step < totalSteps"
            @click="nextStep"
            :disabled="!canProceed"
            class="btn btn-primary"
          >
            Next
            <Icon name="chevron-right" size="16" />
          </button>
          
          <button
            v-if="step === totalSteps"
            @click="submitApplication"
            :disabled="!canSubmit || submitting"
            class="btn btn-primary"
          >
            <Icon v-if="submitting" name="loader" size="16" class="spinning" />
            {{ submitting ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { Verification } from '~/models/Verification'

const emit = defineEmits(['close', 'submitted'])
const authStore = useAuthStore()

// UI State
const step = ref(1)
const selectedType = ref('')
const submitting = ref(false)
const agreedToTerms = ref(false)

// Form data
const formData = reactive({
  fullName: '',
  idType: '',
  idNumber: '',
  idDocumentFile: null,
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: '',
  proofOfAddressFile: null,
  businessName: '',
  businessRegNumber: '',
  businessDocumentFile: null,
  additionalDocuments: []
})

// Verification types
const verificationTypes = [
  {
    key: 'basic',
    name: 'Basic Verification',
    description: 'Verify your identity with government ID',
    icon: 'user-check',
    badge: 'Verified',
    features: [
      'Identity verification',
      'Basic trust badge',
      'Access to verified features'
    ]
  },
  {
    key: 'k2_level_1',
    name: 'K2 Level 1',
    description: 'Enhanced verification with address proof',
    icon: 'shield',
    badge: 'K2 Level 1',
    features: [
      'Identity + address verification',
      'Enhanced trust badge',
      'Higher transaction limits',
      'Priority support'
    ]
  },
  {
    key: 'k2_level_2',
    name: 'K2 Level 2',
    description: 'Highest level verification with additional documents',
    icon: 'shield-check',
    badge: 'K2 Level 2',
    features: [
      'Complete identity verification',
      'Highest trust badge',
      'Maximum transaction limits',
      'VIP support access',
      'Advanced features'
    ]
  },
  {
    key: 'business',
    name: 'Business Verification',
    description: 'Verify your business entity',
    icon: 'briefcase',
    badge: 'Business',
    features: [
      'Business entity verification',
      'Business trust badge',
      'Commercial features',
      'Business support'
    ]
  }
]

// Countries list (simplified)
const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Australia', 'Japan', 'South Korea', 'Singapore', 'Netherlands',
  'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Austria'
]

// Computed properties
const totalSteps = computed(() => {
  if (selectedType.value === 'basic') return 4 // Type, Basic Info, Additional Docs, Review
  if (selectedType.value === 'business') return 4 // Type, Basic Info, Business Info, Review
  return 5 // Type, Basic Info, Address Info, Additional Docs, Review
})

const needsAddressInfo = computed(() => {
  return ['k2_level_1', 'k2_level_2'].includes(selectedType.value)
})

const canProceed = computed(() => {
  switch (step.value) {
    case 1:
      return selectedType.value !== ''
    case 2:
      return formData.fullName && formData.idType && formData.idNumber && formData.idDocumentFile
    case 3:
      if (needsAddressInfo.value) {
        return formData.addressLine1 && formData.city && formData.stateProvince && 
               formData.postalCode && formData.country && formData.proofOfAddressFile
      }
      if (selectedType.value === 'business') {
        return formData.businessName && formData.businessRegNumber && formData.businessDocumentFile
      }
      return true
    case 4:
      return true // Additional docs are optional
    default:
      return true
  }
})

const canSubmit = computed(() => {
  return canProceed.value && agreedToTerms.value
})

// Methods
const selectVerificationType = (type) => {
  selectedType.value = type
}

const nextStep = () => {
  if (canProceed.value && step.value < totalSteps.value) {
    step.value++
  }
}

const previousStep = () => {
  if (step.value > 1) {
    step.value--
  }
}

const handleIdDocumentUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
    formData.idDocumentFile = file
  } else {
    alert('File size must be less than 10MB')
  }
}

const removeIdDocument = () => {
  formData.idDocumentFile = null
}

const handleProofOfAddressUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.size <= 10 * 1024 * 1024) {
    formData.proofOfAddressFile = file
  } else {
    alert('File size must be less than 10MB')
  }
}

const removeProofOfAddress = () => {
  formData.proofOfAddressFile = null
}

const handleBusinessDocumentUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.size <= 10 * 1024 * 1024) {
    formData.businessDocumentFile = file
  } else {
    alert('File size must be less than 10MB')
  }
}

const removeBusinessDocument = () => {
  formData.businessDocumentFile = null
}

const handleAdditionalDocsUpload = (event) => {
  const files = Array.from(event.target.files)
  files.forEach(file => {
    if (file.size <= 10 * 1024 * 1024) {
      formData.additionalDocuments.push(file)
    } else {
      alert(`File ${file.name} is too large. Maximum size is 10MB.`)
    }
  })
}

const removeAdditionalDocument = (index) => {
  formData.additionalDocuments.splice(index, 1)
}

const submitApplication = async () => {
  try {
    submitting.value = true
    
    // Upload files and get URLs (implement file upload logic)
    const idDocumentUrl = await uploadFile(formData.idDocumentFile)
    const proofOfAddressUrl = formData.proofOfAddressFile ? 
      await uploadFile(formData.proofOfAddressFile) : null
    const businessDocumentUrl = formData.businessDocumentFile ? 
      await uploadFile(formData.businessDocumentFile) : null
    const additionalDocumentUrls = await Promise.all(
      formData.additionalDocuments.map(file => uploadFile(file))
    )
    
    // Submit application
    const applicationData = {
      type: selectedType.value,
      fullName: formData.fullName,
      idType: formData.idType,
      idNumber: formData.idNumber,
      idDocumentUrl: idDocumentUrl,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      stateProvince: formData.stateProvince,
      postalCode: formData.postalCode,
      country: formData.country,
      proofOfAddressUrl: proofOfAddressUrl,
      businessName: formData.businessName,
      businessRegNumber: formData.businessRegNumber,
      businessDocumentUrl: businessDocumentUrl,
      additionalDocuments: additionalDocumentUrls
    }
    
    await Verification.submitApplication(authStore.user.id, applicationData)
    
    emit('submitted')
    
  } catch (error) {
    console.error('Error submitting verification application:', error)
    alert('Failed to submit application. Please try again.')
  } finally {
    submitting.value = false
  }
}

// Utility functions
const uploadFile = async (file) => {
  // Implement file upload logic here
  // Return the uploaded file URL
  return `https://example.com/uploads/${file.name}`
}

const getVerificationTypeName = (type) => {
  const verType = verificationTypes.find(t => t.key === type)
  return verType ? verType.name : type
}

const formatIdType = (type) => {
  const types = {
    'passport': 'Passport',
    'drivers_license': "Driver's License",
    'national_id': 'National ID Card'
  }
  return types[type] || type
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.verification-container {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.step-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.step-description {
  color: #6b7280;
  margin-bottom: 2rem;
}

.verification-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.verification-type-card {
  position: relative;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.verification-type-card:hover {
  border-color: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.verification-type-card.selected {
  border-color: #4f46e5;
  background: #f8faff;
}

.type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: #f3f4f6;
  border-radius: 50%;
  margin-bottom: 1rem;
  color: #4f46e5;
}

.verification-type-card.selected .type-icon {
  background: #e0e7ff;
}

.verification-type-card h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.verification-type-card p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.type-features {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.feature-item svg {
  color: #10b981;
}

.type-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-basic {
  background: #fef3c7;
  color: #92400e;
}

.badge-k2_level_1 {
  background: #dbeafe;
  color: #1e40af;
}

.badge-k2_level_2 {
  background: #d1fae5;
  color: #065f46;
}

.badge-business {
  background: #e0e7ff;
  color: #4338ca;
}

.verification-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: border-color 0.2s;
  cursor: pointer;
}

.file-upload-area:hover {
  border-color: #4f46e5;
}

.file-input {
  display: none;
}

.upload-content p {
  margin: 0.5rem 0;
  color: #374151;
}

.upload-note {
  font-size: 0.875rem;
  color: #6b7280;
}

.upload-btn {
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.upload-btn:hover {
  background: #4338ca;
}

.uploaded-file,
.uploaded-files .uploaded-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.uploaded-files {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.remove-file-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto;
  transition: background-color 0.2s;
}

.remove-file-btn:hover {
  background: #dc2626;
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-item {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.review-item h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.review-item p {
  margin: 0.25rem 0;
  color: #374151;
}

.document-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.document-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: #374151;
}

.terms-agreement {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.5;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 2px;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: #4f46e5;
  border-color: #4f46e5;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-label a {
  color: #4f46e5;
  text-decoration: none;
}

.checkbox-label a:hover {
  text-decoration: underline;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.step-indicator {
  display: flex;
  gap: 0.5rem;
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  transition: all 0.2s;
}

.step-dot.active {
  border-color: #4f46e5;
  background: #4f46e5;
  color: white;
}

.step-dot.completed {
  border-color: #10b981;
  background: #10b981;
  color: white;
}

.navigation-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    margin: 0;
    border-radius: 0;
    height: 100vh;
    max-height: 100vh;
  }
  
  .verification-types {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .navigation-buttons {
    justify-content: space-between;
  }
  
  .navigation-buttons .btn {
    flex: 1;
  }
}
</style>
