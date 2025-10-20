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
      console.log('Current URL:', window.location.href)
      console.log('Parent URL:', document.referrer)

      // Try to get ticket ID from multiple sources
      let ticketId = null

      // Method 1: Check URL parameters first (e.g., ?ticket_id=7)
      try {
        const urlParams = new URLSearchParams(window.location.search)
        ticketId = urlParams.get('ticket_id') || urlParams.get('id') || urlParams.get('request_id')

        if (ticketId) {
          console.log('✓ Ticket ID from URL parameter:', ticketId)
        } else {
          console.log('No ticket_id in URL parameters')
        }
      } catch (error) {
        console.error('Error parsing URL parameters:', error)
      }

      // Method 2: Try to extract from referrer URL if not in params
      if (!ticketId) {
        try {
          const isInIframe = window.self !== window.top
          console.log('Is in iframe:', isInIframe)

          if (document.referrer) {
            console.log('Full referrer URL:', document.referrer)

            // Try multiple patterns to extract ticket ID
            // Pattern 1: /requests/7
            let match = document.referrer.match(/\/requests\/(\d+)/)

            // Pattern 2: /hc/*/requests/7
            if (!match) {
              match = document.referrer.match(/\/hc\/[^\/]+\/requests\/(\d+)/)
            }

            // Pattern 3: ticket_id=7 or id=7 in query params
            if (!match) {
              match = document.referrer.match(/[?&](?:ticket_)?id=(\d+)/)
            }

            if (match) {
              ticketId = match[1]
              console.log('✓ Extracted ticket ID from referrer URL:', ticketId)
            } else {
              console.error('✗ Could not match ticket ID pattern in referrer URL')
            }
          } else {
            console.log('No referrer available')
          }
        } catch (error) {
          console.error('Error checking referrer:', error)
        }
      }

      // Get agent data from URL parameters (passed from Zendesk template)
      const urlParams = new URLSearchParams(window.location.search)
      const agentName = urlParams.get('agent_name') || urlParams.get('assignee_name')
      const agentEmail = urlParams.get('agent_email') || urlParams.get('assignee_email')
      const lightningAddr = urlParams.get('lightning_address') || urlParams.get('lightning_addr')

      console.log('Agent data from URL:')
      console.log('- Name:', agentName)
      console.log('- Email:', agentEmail)
      console.log('- Lightning from URL:', lightningAddr)

      if (agentName) {
        console.log('✓ Using agent data from URL parameters')
        setAgent({
          name: agentName,
          email: agentEmail || '',
          avatarUrl: ''
        })

        // Fetch Lightning address from API if not provided in URL
        if (!lightningAddr && agentEmail) {
          console.log('Fetching Lightning address from API for:', agentEmail)

          try {
            const apiUrl = `${window.location.origin}/api/get-agent?agent_email=${encodeURIComponent(agentEmail)}`
            console.log('API URL:', apiUrl)

            fetch(apiUrl)
              .then(response => response.json())
              .then(data => {
                console.log('API Response:', data)
                if (data.lightning_address) {
                  console.log('✓ Lightning address from API:', data.lightning_address)
                  setLightningAddress(data.lightning_address)
                } else {
                  console.warn('No Lightning address in API response, using default')
                  setLightningAddress(DEFAULT_LIGHTNING_ADDRESS)
                }
              })
              .catch(error => {
                console.error('Error fetching Lightning address from API:', error)
                console.log('Using default Lightning address')
                setLightningAddress(DEFAULT_LIGHTNING_ADDRESS)
              })
          } catch (error) {
            console.error('Error calling API:', error)
            setLightningAddress(DEFAULT_LIGHTNING_ADDRESS)
          }
        } else {
          setLightningAddress(lightningAddr || DEFAULT_LIGHTNING_ADDRESS)
        }

        setLoading(false)
      } else {
        console.warn('No agent data in URL parameters')
        console.log('Please pass agent_name in the iframe URL')
        setAgent({
          name: 'Configuration Needed',
          email: 'Add agent_name to iframe URL',
          avatarUrl: ''
        })
        setLightningAddress(DEFAULT_LIGHTNING_ADDRESS)
        setLoading(false)
      }

      // Try initializing ZAF Client for comment posting
      if (window.ZAFClient) {
        try {
          const client = window.ZAFClient.init()
          console.log('ZAF Client initialized for comments:', !!client)
          if (client) {
            setZafClient(client)
          }
        } catch (error) {
          console.warn('ZAF Client init failed:', error)
        }
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
