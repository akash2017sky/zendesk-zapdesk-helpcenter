import { useState, useEffect } from 'react'
import { generateLightningQR } from './services/lightning'

// Default fallback Lightning address if agent doesn't have one configured
const DEFAULT_LIGHTNING_ADDRESS = 'covertbrian73@walletofsatoshi.com'

function App() {
  const [zafClient, setZafClient] = useState(null)
  const [agent, setAgent] = useState(null)
  const [lightningAddress, setLightningAddress] = useState(DEFAULT_LIGHTNING_ADDRESS)
  const [selectedSats, setSelectedSats] = useState(100)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState(null)

  useEffect(() => {
    const initializeWidget = async () => {
      console.log('Initializing Zapdesk widget...')
      console.log('ZAFClient available:', typeof window.ZAFClient)

      // Check if ZAFClient is available
      if (!window.ZAFClient) {
        console.error('ZAFClient not found! Widget must be loaded in Zendesk Help Center.')
        // Try waiting a bit for the script to load
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (!window.ZAFClient) {
          console.error('ZAFClient still not available after waiting.')
          setAgent({
            name: 'Error: Not in Zendesk',
            email: 'Please embed in Help Center',
            avatarUrl: ''
          })
          setLightningAddress(DEFAULT_LIGHTNING_ADDRESS)
          setLoading(false)
          return
        }
      }

      // Initialize Zendesk ZAF Client
      const client = window.ZAFClient.init()
      console.log('ZAF Client initialized:', !!client)
      setZafClient(client)

      if (!client) {
        console.error('Failed to initialize ZAF client')
        setAgent({
          name: 'Error: Client Init Failed',
          email: 'Check console for details',
          avatarUrl: ''
        })
        setLightningAddress(DEFAULT_LIGHTNING_ADDRESS)
        setLoading(false)
        return
      }

      try {
        // Fetch ticket/request information
        const contextData = await client.get(['ticket', 'currentUser'])
        const ticketData = contextData['ticket']
        const ticketId = ticketData.id

        console.log('Ticket ID:', ticketId)
        console.log('Current User:', contextData['currentUser'])

        // Fetch the full request details including assignee from API
        const requestResponse = await client.request({
          url: `/api/v2/requests/${ticketId}.json`,
          type: 'GET'
        })

        const requestData = JSON.parse(requestResponse.responseText)
        const request = requestData.request
        const assigneeId = request.assignee_id

        console.log('Request assignee_id:', assigneeId)

        if (assigneeId) {
          // Fetch assignee user details
          const userResponse = await client.request({
            url: `/api/v2/users/${assigneeId}.json`,
            type: 'GET'
          })

          const userData = JSON.parse(userResponse.responseText)
          const user = userData.user

          console.log('Agent fetched:', user.name, user.email)

          setAgent({
            name: user.name || 'Agent',
            email: user.email || '',
            avatarUrl: user.photo?.content_url || ''
          })

          // Check for Lightning address in user fields or notes
          const agentLightningAddress =
            user.user_fields?.lightning_address ||
            user.notes?.match(/lightning:\s*(\S+@\S+)/i)?.[1] ||
            DEFAULT_LIGHTNING_ADDRESS

          console.log('Lightning address:', agentLightningAddress)
          setLightningAddress(agentLightningAddress)
        } else {
          console.warn('No assignee found for this ticket')
          setAgent({
            name: 'Unassigned',
            email: 'No agent assigned yet',
            avatarUrl: ''
          })
          setLightningAddress(DEFAULT_LIGHTNING_ADDRESS)
        }

        setLoading(false)

        // Resize iframe
        client.invoke('resize', { width: '100%', height: '750px' })
      } catch (error) {
        console.error('Error in widget initialization:', error)
        console.error('Error details:', error.message, error.stack)
        setAgent({
          name: 'Error Loading Agent',
          email: 'Check browser console',
          avatarUrl: ''
        })
        setLightningAddress(DEFAULT_LIGHTNING_ADDRESS)
        setLoading(false)
      }
    }

    initializeWidget()
  }, [])

  // Generate QR code when sat amount or lightning address changes
  useEffect(() => {
    const generateQR = async () => {
      if (!lightningAddress) return

      setQrLoading(true)
      setQrError(null)

      try {
        console.log(`Generating QR for ${selectedSats} sats to ${lightningAddress}`)
        const { qrDataUrl, lnurlString } = await generateLightningQR(
          lightningAddress,
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
  }, [selectedSats, lightningAddress])

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
      <div className="content">
        <h2 className="subtitle">⚡ Tip {agent.name} with Bitcoin Lightning</h2>

        <div className="agent-info">
          <div className="agent-avatar">
            {agent.avatarUrl ? (
              <img src={agent.avatarUrl} alt={agent.name} />
            ) : (
              <div className="avatar-placeholder">{agent.name.charAt(0)}</div>
            )}
          </div>
          <div className="agent-details">
            <div className="agent-name">{agent.name}</div>
            <div className="agent-label">Your support agent</div>
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
          Scan the QR code with your Lightning wallet to send the tip. Click 'Mark as Paid' after payment is complete.
        </div>

        <div className="branding">
          Powered by <a href="https://knowall.ai" target="_blank" rel="noopener noreferrer">Zapdesk from KnowAll AI</a>
        </div>
      </div>
    </div>
  )
}

export default App
