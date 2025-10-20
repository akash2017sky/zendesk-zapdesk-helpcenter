import { useState, useEffect } from 'react'
import { generateLightningQR } from './services/lightning'

// Lightning address - replace with your actual Lightning address
const LIGHTNING_ADDRESS = 'covertbrian73@walletofsatoshi.com'

function App() {
  const [zafClient, setZafClient] = useState(null)
  const [agent, setAgent] = useState(null)
  const [selectedSats, setSelectedSats] = useState(100)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState(null)

  useEffect(() => {
    // Initialize Zendesk ZAF Client
    const client = window.ZAFClient?.init()
    setZafClient(client)

    if (client) {
      // Fetch ticket and agent information
      client.get(['ticket', 'ticket.assignee.user']).then((data) => {
        const assigneeUser = data['ticket.assignee.user']
        setAgent({
          name: assigneeUser.name || 'Agent',
          email: assigneeUser.email || '',
          avatarUrl: assigneeUser.avatarUrl || ''
        })
        setLoading(false)
      }).catch((error) => {
        console.error('Error fetching agent info:', error)
        // Set default agent for testing
        setAgent({
          name: 'Support Agent',
          email: 'agent@knowall.ai',
          avatarUrl: ''
        })
        setLoading(false)
      })

      // Resize iframe
      client.invoke('resize', { width: '100%', height: '700px' })
    } else {
      // For development without Zendesk
      setAgent({
        name: 'Akash Jadhav',
        email: 'akash.jadhav@knowall.ai',
        avatarUrl: ''
      })
      setLoading(false)
    }
  }, [])

  // Generate QR code when sat amount changes
  useEffect(() => {
    const generateQR = async () => {
      setQrLoading(true)
      setQrError(null)

      try {
        console.log(`Generating QR for ${selectedSats} sats to ${LIGHTNING_ADDRESS}`)
        const { qrDataUrl, lnurlString } = await generateLightningQR(
          LIGHTNING_ADDRESS,
          selectedSats
        )
        setQrData(qrDataUrl)
        console.log('QR code generated successfully')
      } catch (error) {
        console.error('Failed to generate QR:', error)
        setQrError(error.message || 'Failed to generate QR code')
      } finally {
        setQrLoading(false)
      }
    }

    generateQR()
  }, [selectedSats])

  const handleSatSelection = (sats) => {
    setSelectedSats(sats)
  }

  const handleSubmit = async () => {
    if (!zafClient) {
      alert('Zendesk client not initialized')
      return
    }

    setSubmitting(true)

    try {
      const commentText = `⚡ Lightning Tip Sent: ${selectedSats.toLocaleString()} sats${message ? `\n\nMessage: ${message}` : ''}\n\nTip sent via Zapdesk by KnowAll AI`

      // Add comment to ticket
      await zafClient.request({
        url: '/api/v2/requests/{{ticket.id}}/comments.json',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          request: {
            comment: {
              body: commentText,
              public: false
            }
          }
        })
      })

      alert('Payment marked as complete! Comment added to ticket.')
      setMessage('')
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Failed to add comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-left">
          <div className="logo">⚡</div>
          <h1 className="title">Zapdesk by KnowAll AI</h1>
        </div>
      </div>

      <div className="content">
        <h2 className="subtitle">Tip the agent instantly with Bitcoin Lightning</h2>

        <div className="agent-info">
          <div className="agent-avatar">
            {agent.avatarUrl ? (
              <img src={agent.avatarUrl} alt={agent.name} />
            ) : (
              <div className="avatar-placeholder">{agent.name.charAt(0)}</div>
            )}
          </div>
          <div className="agent-details">
            <div className="agent-email">{agent.email}</div>
            <div className="agent-label">Tip the agent with sats</div>
          </div>
        </div>

        <div className="sat-buttons">
          <button
            className={`sat-button ${selectedSats === 100 ? 'active' : ''}`}
            onClick={() => handleSatSelection(100)}
          >
            100 sats
          </button>
          <button
            className={`sat-button ${selectedSats === 1000 ? 'active' : ''}`}
            onClick={() => handleSatSelection(1000)}
          >
            1,000 sats
          </button>
          <button
            className={`sat-button ${selectedSats === 10000 ? 'active' : ''}`}
            onClick={() => handleSatSelection(10000)}
          >
            10,000 sats
          </button>
        </div>

        <div className="qr-code-container">
          {qrLoading && (
            <div className="qr-loading">
              <div className="spinner"></div>
              <p>Generating invoice...</p>
            </div>
          )}
          {qrError && (
            <div className="qr-error">
              <p>⚠️ {qrError}</p>
              <button onClick={() => setSelectedSats(selectedSats)}>Retry</button>
            </div>
          )}
          {qrData && !qrLoading && !qrError && (
            <img
              src={qrData}
              alt="Lightning Invoice QR Code"
              className="qr-code"
            />
          )}
        </div>

        <div className="message-section">
          <label className="message-label">Add a message (optional)</label>
          <textarea
            className="message-input"
            placeholder="Thank you for your help"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Processing...' : 'Mark as Paid'}
        </button>

        <div className="footer-text">
          This widget uses the Bitcoin Lightning to send tips directly to your support agent — Please click on the 'Mark as Paid' button manually.
        </div>
      </div>
    </div>
  )
}

export default App
