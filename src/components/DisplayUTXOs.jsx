import React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { displayDate } from '../utils'
import Balance from './Balance'
import Alert from './Alert'
import { useSettings } from '../context/SettingsContext'
import { useCurrentWallet } from '../context/WalletContext'
import * as Api from '../libs/JmWalletApi'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Stack from 'react-bootstrap/Stack'
import Spinner from 'react-bootstrap/Spinner'

const Utxo = ({ utxo, ...props }) => {
  const { t } = useTranslation()
  const settings = useSettings()
  const currentWallet = useCurrentWallet()

  const [alert, setAlert] = useState(null)
  const [isSending, setIsSending] = useState(false)

  const onClickFreeze = async (utxo) => {
    if (isSending) return

    const { name: walletName, token } = currentWallet

    setAlert(null)
    setIsSending(true)

    await Api.postFreeze({ walletName, token }, { utxo: utxo.utxo, freeze: !utxo.frozen })
      .then(async (res) => {
        if (res.ok) {
          return true
        } else {
          const { message } = await res.json()
          throw new Error(message || t('current_wallet_advanced.error_freeze_failed'))
        }
      })
      .then((_) => (utxo.frozen = !utxo.frozen))
      .catch((err) => {
        setAlert({ variant: 'danger', message: err.message, dismissible: true })
      })
      // show the loader a little longer to avoid flickering
      .then((_) => new Promise((r) => setTimeout(r, 200)))
      .finally(() => setIsSending(false))
  }

  return (
    <Card {...props}>
      <Card.Body>
        <Row>
          <Col sm={6} md={8}>
            <Stack className="d-flex align-items-start">
              <div>
                <code className="text-break">{utxo.address}</code>
              </div>
              <div>
                {utxo.locktime && (
                  <span className="me-2">
                    {t('current_wallet_advanced.label_locked_until')} {displayDate(utxo.locktime)}
                  </span>
                )}
                {utxo.label && <span className="me-2 badge bg-light">{utxo.label}</span>}
                {utxo.frozen && <span className="me-2 badge bg-info">{t('current_wallet_advanced.label_frozen')}</span>}
                {utxo.confirmations === 0 && (
                  <span className="badge bg-secondary">{t('current_wallet_advanced.label_unconfirmed')}</span>
                )}
              </div>
            </Stack>
          </Col>
          <Col sm={6} md={4}>
            <Stack className="d-flex align-items-end">
              <div>
                <Balance
                  valueString={`${utxo.value}`}
                  convertToUnit={settings.unit}
                  showBalance={settings.showBalance}
                />
              </div>
              <div>
                <small className="text-secondary">{utxo.confirmations} Confirmations</small>
              </div>
              <div>
                <Button
                  size="sm"
                  variant={utxo.frozen ? 'outline-warning' : 'outline-info'}
                  disabled={isSending}
                  onClick={() => onClickFreeze(utxo)}
                >
                  {isSending && (
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="ms-1 me-2"
                    />
                  )}
                  {utxo.frozen
                    ? t('current_wallet_advanced.button_unfreeze')
                    : t('current_wallet_advanced.button_freeze')}
                </Button>
              </div>
            </Stack>
          </Col>
          {alert && (
            <Col xs={12}>
              <Alert {...alert} />
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  )
}

export default function DisplayUTXOs({ utxos, ...props }) {
  return (
    <div {...props}>
      {utxos.map((utxo, index) => (
        <Utxo
          key={utxo.utxo}
          utxo={utxo}
          className={`bg-transparent rounded-0 border-start-0 border-end-0 border-bottom-0 ${
            index === 0 ? 'border-top-0' : 'border-top-1'
          }`}
        />
      ))}
    </div>
  )
}
