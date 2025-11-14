-- Add processing_status column to track PDF processing progress
ALTER TABLE knowledge_documents
ADD COLUMN processing_status JSONB DEFAULT NULL;

-- Add index for querying documents in process
CREATE INDEX idx_processing_documents 
ON knowledge_documents(processed, processing_status)
WHERE processed = false;