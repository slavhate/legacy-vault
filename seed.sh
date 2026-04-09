#!/bin/bash
# Legacy Vault - Demo Data Seeder
# Populates a user's vault with fictional sample data across all sections.
#
# DISCLAIMER: All names, addresses, phone numbers, account numbers, and other
# details in this file are ENTIRELY FICTIONAL. Any resemblance to real persons,
# living or dead, or actual entities is purely coincidental.
#
# Usage: ./seed.sh <jwt_token>
#   Get the token by logging in via the API first.

BASE="http://localhost:3000/api"
TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "Usage: ./seed.sh <jwt_token>"
  echo "  Log in first to get a token, then pass it as the argument."
  exit 1
fi

post() {
  curl -s -X POST "$BASE/vault/entries" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$1" > /dev/null
  echo -n "."
}

echo -n "Seeding Personal"
post '{"section":"personal","title":"Arjun Mehta","fields":{"full_name":"Arjun Mehta","date_of_birth":"1985-03-22","place_of_birth":"Udaipur, Rajasthan","nationality":"Indian","national_id":"XXXX-XXXX-0000","passport_number":"X0000000","passport_expiry":"2032-08-15","drivers_license":"RJ-00-2015-0000000","tax_id":"AAAAA0000A","blood_group":"O+","address":"10 Lotus Garden Road\nSample Town 100001\nIndia"},"notes":"All IDs are fictional demo data."}'
echo " done"

echo -n "Seeding Bank Accounts"
post '{"section":"bank_accounts","title":"Demo Savings - Primary","fields":{"bank_name":"First National Bank","account_type":"Savings","account_number":"0000-0000-0000-1111","ifsc_routing":"DEMO0001234","branch":"Main Street Branch","nominee":"Neha Mehta (Wife)","balance_approx":"INR 12,00,000","online_url":"https://example.com/netbanking","username":"demo_user"},"notes":"Demo salary account. Auto-debit for home loan EMI on 5th of every month."}'
post '{"section":"bank_accounts","title":"Demo Fixed Deposit","fields":{"bank_name":"National Savings Bank","account_type":"Fixed Deposit","account_number":"0000-0000-0000-2222","ifsc_routing":"DEMO0005678","branch":"Central Branch","nominee":"Neha Mehta (Wife)","balance_approx":"INR 20,00,000","online_url":"https://example.com/banking","username":"demo_fd_user"},"notes":"Matures March 2028. Auto-renewal ON."}'
post '{"section":"bank_accounts","title":"Demo Joint Account","fields":{"bank_name":"City Trust Bank","account_type":"Joint Account","account_number":"0000-0000-0000-3333","ifsc_routing":"DEMO0009012","branch":"Market Road Branch","nominee":"Rohan Mehta (Son)","balance_approx":"INR 3,50,000","online_url":"https://example.com/citybank","username":"demo_joint"},"notes":"Joint with Neha. Used for household expenses."}'
echo " done"

echo -n "Seeding Investments"
post '{"section":"investments","title":"Demo Equity Portfolio","fields":{"institution":"TradeEasy Brokers","type":"Stocks","account_number":"TE-000-1234","value_approx":"INR 25,00,000","nominee":"Neha Mehta","login_url":"https://example.com/trading","username":"demo_trader"},"notes":"Mix of large-cap and mid-cap. SIP in index fund - INR 20,000/month."}'
post '{"section":"investments","title":"Demo Mutual Funds","fields":{"institution":"FundHub","type":"Mutual Funds","account_number":"FH-000-5678","value_approx":"INR 10,00,000","nominee":"Neha Mehta","login_url":"https://example.com/funds","username":"demo_funds"},"notes":"3 SIPs running. Review allocation annually."}'
post '{"section":"investments","title":"Demo Crypto Holdings","fields":{"institution":"CoinDemo Exchange","type":"Cryptocurrency","account_number":"CDX-000-0000","value_approx":"~0.5 BTC","nominee":"Transfer manually","login_url":"https://example.com/crypto","username":"demo@example.com"},"notes":"Hardware wallet seed phrase is in bank locker. 24-word phrase on steel plate inside red pouch."}'
post '{"section":"investments","title":"Demo PPF Account","fields":{"institution":"National Savings Bank","type":"PPF / EPF","account_number":"PPF-0000000000","value_approx":"INR 15,00,000","nominee":"Neha Mehta","login_url":"https://example.com/ppf","username":"demo_ppf"},"notes":"Matures 2031. Contributing max per year for tax benefit."}'
echo " done"

echo -n "Seeding Retirement"
post '{"section":"retirement","title":"Demo EPF Account","fields":{"provider":"Employer Corp","type":"EPF","account_number":"XX/DEMO/0000000/000","value_approx":"INR 22,00,000","beneficiary":"Neha Mehta (100%)","login_url":"https://example.com/epf"},"notes":"UAN: 000000000000. Aadhaar linked."}'
post '{"section":"retirement","title":"Demo NPS Account","fields":{"provider":"PensionCo","type":"NPS","account_number":"PRAN: 000000000000","value_approx":"INR 8,00,000","beneficiary":"Neha Mehta","login_url":"https://example.com/nps"},"notes":"Contributing 50k/year for tax benefit. Aggressive allocation: 75% equity."}'
echo " done"

echo -n "Seeding Insurance"
post '{"section":"insurance","title":"Demo Term Life Plan","fields":{"provider":"LifeShield Insurance","type":"Term Life","policy_number":"LS-000-000000","sum_assured":"INR 1,00,00,000","premium":"INR 12,000","frequency":"Annual","maturity_date":"2055-03-22","nominee":"Neha Mehta","agent_name":"Demo Agent","agent_phone":"+91 00000 00001"},"notes":"Pure term plan, covers till age 70. Premium due every March."}'
post '{"section":"insurance","title":"Demo Family Health Plan","fields":{"provider":"HealthFirst Insurance","type":"Health","policy_number":"HF-000-000000","sum_assured":"INR 10,00,000","premium":"INR 22,000","frequency":"Annual","maturity_date":"2027-01-15","nominee":"Family Floater","agent_name":"Demo Agent","agent_phone":"+91 00000 00001"},"notes":"Covers entire family. Cashless at network hospitals."}'
post '{"section":"insurance","title":"Demo Car Insurance","fields":{"provider":"AutoGuard Insurance","type":"Auto","policy_number":"AG-000-000000","sum_assured":"IDV INR 7,50,000","premium":"INR 16,000","frequency":"Annual","maturity_date":"2027-03-20"},"notes":"Demo Car 2022 (XX 00 YY 0000). Comprehensive + zero depreciation."}'
echo " done"

echo -n "Seeding Real Estate"
post '{"section":"real_estate","title":"Home - Sample Town","fields":{"type":"Residential","address":"10 Lotus Garden Road\nSample Town 100001","ownership":"Joint Owner","co_owners":"Neha Mehta (wife)","purchase_value":"INR 80,00,000 (2016)","current_value":"INR 1,50,00,000 (est.)","deed_location":"Bank locker + scan in cloud drive","mortgage_provider":"HomeFirst Finance","mortgage_account":"HF-LOAN-000000","mortgage_balance":"INR 18,00,000"},"notes":"EMI INR 32,000/month auto-debited on 5th. ~4 years remaining."}'
post '{"section":"real_estate","title":"Ancestral Land - Countryside","fields":{"type":"Agricultural","address":"Survey No 000, Rural Road\nCountryside District","ownership":"Joint Owner","co_owners":"Brother - Vikram Mehta (50%)","purchase_value":"Inherited","current_value":"INR 30,00,000 (est.)","deed_location":"With Vikram. Copy in bank locker."},"notes":"Ancestral property. 2 acres agricultural. Brother manages it. Rental income ~15k/month split equally."}'
echo " done"

echo -n "Seeding Debts"
post '{"section":"debts","title":"Demo Home Loan","fields":{"creditor":"HomeFirst Finance","type":"Mortgage","account_number":"HF-LOAN-000000","outstanding":"INR 18,00,000","monthly_payment":"INR 32,000","interest_rate":"8.5% (floating)","end_date":"2030-04-05","collateral":"10 Lotus Garden Road property"},"notes":"Auto-debit from savings. Can prepay without penalty."}'
post '{"section":"debts","title":"Demo Credit Card","fields":{"creditor":"City Trust Bank","type":"Credit Card","account_number":"0000-XXXX-XXXX-0000","outstanding":"INR 35,000 (revolving)","monthly_payment":"Full balance each month","interest_rate":"42% APR if not paid"},"notes":"Rewards credit card. Always pay full balance. Auto-pay set up."}'
post '{"section":"debts","title":"Personal Loan to Friend","fields":{"creditor":"Informal Loan","type":"Informal Loan","outstanding":"INR 2,00,000","interest_rate":"0% (friend)","end_date":"2027-06-01"},"notes":"Lent to college friend Dev Kapoor in Jan 2025. Agreed to repay by June 2027. Chat messages as proof. Dev phone: +91 00000 00002."}'
echo " done"

echo -n "Seeding Digital Accounts"
post '{"section":"digital","title":"Gmail - Primary","fields":{"service":"Google / Gmail","type":"Email","url":"https://mail.google.com","username":"arjun.demo@example.com","password":"See password manager","two_factor":"Authenticator app on phone. Backup codes in bank locker envelope.","recovery_email":"neha.demo@example.com"},"notes":"Primary email linked to all financial accounts. Cloud drive has scanned copies of all property documents."}'
post '{"section":"digital","title":"Password Manager","fields":{"service":"Password Manager","type":"Other","url":"https://example.com/vault","username":"arjun.demo@example.com","password":"Master password written on card inside bank locker","two_factor":"Recovery code in same envelope as Google backup codes","recovery_email":"arjun.alt@example.com"},"notes":"ALL other passwords are stored here. This is the master key to everything digital. Emergency sheet in bank locker."}'
post '{"section":"digital","title":"LinkedIn","fields":{"service":"LinkedIn","type":"Social Media","url":"https://example.com/linkedin/demo","username":"arjun.demo@example.com","password":"In password manager"}}'
post '{"section":"digital","title":"Streaming Subscription","fields":{"service":"StreamFlix","type":"Subscription","url":"https://example.com/stream","username":"arjun.demo@example.com","password":"In password manager","monthly_cost":"INR 649"},"notes":"Family plan. Cancel if no longer needed."}'
post '{"section":"digital","title":"Cloud Hosting Account","fields":{"service":"CloudServe","type":"Other","url":"https://example.com/cloud","username":"arjun.demo@example.com","password":"In password manager","two_factor":"Hardware key in desk drawer","monthly_cost":"~INR 2,000"},"notes":"Runs a few side projects. Shut down all instances to stop billing if I am gone."}'
echo " done"

echo -n "Seeding Vehicles"
post '{"section":"vehicles","title":"Demo Sedan 2022","fields":{"type":"Car","make_model":"Horizon Civic LX","year":"2022","registration":"XX 00 YY 0000","vin":"DEMO00SEDAN0000000","loan_provider":"Fully paid","insurance_policy":"AG-000-000000"},"notes":"Serviced at authorized dealer. Next service at 45,000 km. Spare key in hallway drawer."}'
post '{"section":"vehicles","title":"Demo Motorcycle 2019","fields":{"type":"Motorcycle","make_model":"Thunderbolt Classic 350","year":"2019","registration":"XX 00 ZZ 1111","vin":"DEMO00MOTO00000000","loan_provider":"Fully paid","insurance_policy":"AG-000-000001"},"notes":"Kept at office parking mostly. Insurance renewal in August."}'
echo " done"

echo -n "Seeding Valuables"
post '{"section":"valuables","title":"Bank Locker Contents","fields":{"type":"Safe Deposit Box","description":"National Savings Bank, Central Branch\nLocker #000\nContains: Property deeds, gold jewelry (~100g), FD certificates, password manager master password card, 2FA backup codes, crypto seed phrase (steel plate)","location":"NSB Central Branch","estimated_value":"Jewelry ~INR 5,00,000 + documents","proof":"Locker agreement in home filing cabinet"},"notes":"Joint locker with Neha. She has a key too. Locker rent auto-debited."}'
post '{"section":"valuables","title":"Gold Jewelry at Home","fields":{"type":"Gold / Silver","description":"Wedding set, 2 gold chains, kids gold coins (4 pcs)","location":"Home safe - bedroom closet. Combination: see password manager","estimated_value":"~INR 3,50,000","proof":"Purchase receipts in home filing cabinet"}}'
post '{"section":"valuables","title":"Art Collection","fields":{"type":"Art","description":"3 signed prints by contemporary artists, 1 original landscape painting","location":"Living room and study","estimated_value":"INR 2,00,000 - 4,00,000","proof":"Certificate of authenticity in filing cabinet"},"notes":"The landscape was bought at an auction in 2018. Contact Gallerist: Priya at DemoArt Gallery +91 00000 00003."}'
echo " done"

echo -n "Seeding Contacts"
post '{"section":"contacts","title":"Lawyer","fields":{"role":"Lawyer","name":"Advocate Sanjay Rao","organization":"Rao & Associates","phone":"+91 00000 00004","email":"sanjay.rao@example.com","address":"100 Demo Lane\nSample Town 100001","context":"Handles property matters, will drafting, and general legal counsel. Has a copy of our will."}}'
post '{"section":"contacts","title":"CA - Chartered Accountant","fields":{"role":"Accountant / CA","name":"Kavita Desai","organization":"K. Desai & Co.","phone":"+91 00000 00005","email":"kavita.desai@example.com","address":"Demo Business Park, Sample Town","context":"Files ITR every year, handles all tax planning. Has copies of last 7 years returns. Call immediately for tax implications of any inheritance."}}'
post '{"section":"contacts","title":"Financial Advisor","fields":{"role":"Financial Advisor","name":"Ravi Krishnan","organization":"WealthWise Advisors","phone":"+91 00000 00006","email":"ravi.k@example.com","context":"Relationship manager. Advises on equity portfolio and mutual fund selection. Reviews portfolio quarterly."}}'
post '{"section":"contacts","title":"Family Doctor","fields":{"role":"Doctor","name":"Dr. Anita Joshi","organization":"City General Hospital","phone":"+91 00000 00007","email":"dr.anita@example.com","context":"Family physician for 10 years. Knows full medical history."}}'
post '{"section":"contacts","title":"Employer HR Contact","fields":{"role":"Employer","name":"Pooja Nair (HR Head)","organization":"TechCorp Solutions Pvt. Ltd.","phone":"+91 00000 00008","email":"pooja.nair@example.com","address":"TechCorp Tower, Sample Town","context":"Contact for gratuity, pending salary, PF withdrawal, and employment-related benefits. Employee ID: TC-00000."}}'
echo " done"

echo -n "Seeding Legal Documents"
post '{"section":"legal","title":"Last Will and Testament","fields":{"type":"Will","date":"2024-08-15","stored_at":"Original with Advocate Sanjay Rao. Copy in bank locker.","lawyer_name":"Advocate Sanjay Rao","lawyer_phone":"+91 00000 00004","details":"Registered will. Neha gets home + 60% of financial assets. Rohan and Aisha get 20% each. Executor: Neha Mehta. Backup executor: brother Vikram."},"notes":"Last updated Aug 2024. Review every 2 years or after major life event."}'
post '{"section":"legal","title":"Power of Attorney - Neha","fields":{"type":"Power of Attorney","date":"2024-08-15","stored_at":"With Advocate Sanjay Rao + copy at home","lawyer_name":"Advocate Sanjay Rao","lawyer_phone":"+91 00000 00004","details":"General Power of Attorney given to Neha Mehta. Allows her to operate all bank accounts, sign property documents, and handle tax matters."}}'
post '{"section":"legal","title":"Birth Certificates","fields":{"type":"Birth Certificate","stored_at":"Home filing cabinet - Documents folder","details":"Birth certificates for: Arjun, Rohan (2012), Aisha (2024). Originals in filing cabinet, scans in cloud drive."}}'
post '{"section":"legal","title":"Marriage Certificate","fields":{"type":"Marriage Certificate","date":"2008-11-20","stored_at":"Home filing cabinet + scan in cloud drive","details":"Registered marriage certificate. Registration No: DEMO/0000/0000."}}'
echo " done"

echo -n "Seeding Final Wishes"
post '{"section":"final_wishes","title":"Funeral Arrangements","fields":{"category":"Burial / Cremation","details":"I wish to be cremated per family traditions. Simple ceremony. No extravagant spending.","contact_person":"Vikram Mehta (Brother)","contact_phone":"+91 00000 00009"}}'
post '{"section":"final_wishes","title":"Organ Donation","fields":{"category":"Organ Donation","details":"I am a registered organ donor. Donor card in wallet. Please honor this wish - donate whatever is viable.","contact_person":"Dr. Anita Joshi","contact_phone":"+91 00000 00007"}}'
post '{"section":"final_wishes","title":"Message to Family","fields":{"category":"Message to Family","details":"Dear Neha, Rohan, and Aisha - if you are reading this, know that every decision I made was with your happiness in mind. Neha, you are stronger than you know. Trust Sanjay (lawyer) and Kavita (CA) for legal and tax matters. Ravi (financial advisor) can help manage investments. Do not make any hasty financial decisions for at least 6 months. I love you all. - Arjun"}}'
post '{"section":"final_wishes","title":"Charitable Donations","fields":{"category":"Charitable Wishes","details":"Please donate INR 1,00,000 to a children education charity and INR 50,000 to a child welfare organization of your choice.","contact_person":"Neha Mehta"}}'
post '{"section":"final_wishes","title":"Pet Care - Buddy","fields":{"category":"Pet Care","details":"Buddy (Golden Retriever, 4 years old) - vet is Dr. Neel at PetCare Clinic (+91 00000 00010). He is on premium adult dog food. Walks twice daily. If the family cannot keep him, please contact a local rescue organization rather than abandoning him.","contact_person":"Dr. Neel (Vet)","contact_phone":"+91 00000 00010"}}'
echo " done"

echo -n "Seeding Secure Notes"
post '{"section":"secure_notes","title":"Home WiFi and Alarm Codes","fields":{"content":"WiFi Network: MyHome_5G\nWiFi Password: DemoPassword@2024\n\nHome Alarm PIN: 0000\nAlarm Company: SecureHome Services, support: 1800-000-0000\n\nHome safe combination: 00-00-00-00"}}'
post '{"section":"secure_notes","title":"Kids Education Funds","fields":{"content":"Rohan (born 2012):\n- SIP in his name at DemoFund MF\n- SIP: INR 10,000/month in Balanced Advantage Fund\n- Current value: ~INR 10,00,000\n- Folio: DEMO-MF-000000\n\nAisha (born 2024):\n- Savings account at NSB\n- Account: SSY-0000000000\n- Balance: INR 1,50,000\n- Contributing max per year\n\nBoth are for higher education. Do not redeem early unless absolutely necessary."}}'
post '{"section":"secure_notes","title":"Important Annual Deadlines","fields":{"content":"- January 15: Health insurance renewal\n- March 15: Advance tax final installment\n- March 31: PPF contribution deadline, tax-saving investments\n- April 5: Home loan EMI (every month, but first of financial year)\n- May: Term life plan premium\n- July 31: ITR filing deadline\n- August: Motorcycle insurance renewal\n- March 20: Car insurance renewal\n\nKavita (CA) handles most tax deadlines. Insurance agent sends reminders."}}'
echo " done"

echo ""
echo "=== Adding beneficiaries ==="

# Add beneficiaries
RESP=$(curl -s -X POST "$BASE/beneficiaries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Neha Mehta","email":"neha.demo@example.com","phone":"+91 00000 00011","relationship":"Spouse","emergency_waiting_days":3}')
echo "Neha token: $(echo $RESP | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)"

RESP=$(curl -s -X POST "$BASE/beneficiaries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Vikram Mehta","email":"vikram.demo@example.com","phone":"+91 00000 00012","relationship":"Sibling","emergency_waiting_days":7}')
echo "Vikram token: $(echo $RESP | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)"

RESP=$(curl -s -X POST "$BASE/beneficiaries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Advocate Sanjay Rao","email":"sanjay.rao@example.com","phone":"+91 00000 00004","relationship":"Lawyer","emergency_waiting_days":14}')
echo "Sanjay token: $(echo $RESP | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)"

echo ""
echo "=== Activating Dead Man Switch ==="
curl -s -X PUT "$BASE/deadswitch/config" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"check_in_interval_days":30,"grace_period_days":7,"is_active":true}'

echo ""
echo "=== Checking in ==="
curl -s -X POST "$BASE/deadswitch/checkin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo ""
echo "=== SEED COMPLETE ==="
echo "All data above is fictional. See seed.sh header for disclaimer."
