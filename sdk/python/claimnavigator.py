"""
Claim Navigator Python SDK
Enterprise client library for Claim Navigator API

Usage:
    from claimnavigator import ClaimNavigator
    
    client = ClaimNavigator(api_key='your-key', base_url='https://...')
    result = client.create_fnol({...})
"""

import requests
from typing import Optional, Dict, Any
from urllib.parse import urlencode


class ClaimNavigator:
    """Claim Navigator API client"""
    
    def __init__(self, api_key: str = '', base_url: str = 'https://your-site.netlify.app/.netlify/functions/api', timeout: int = 30):
        """
        Initialize ClaimNavigator client
        
        Args:
            api_key: API key for authentication
            base_url: Base URL for API endpoints
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        })
    
    def _request(self, endpoint: str, method: str = 'GET', body: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Make API request
        
        Args:
            endpoint: API endpoint path
            method: HTTP method
            body: Request body (for POST/PUT)
            
        Returns:
            Response data
            
        Raises:
            Exception: If request fails
        """
        url = f'{self.base_url}/{endpoint}'
        
        try:
            if method == 'GET':
                response = self.session.get(url, timeout=self.timeout)
            elif method == 'POST':
                response = self.session.post(url, json=body, timeout=self.timeout)
            elif method == 'PUT':
                response = self.session.put(url, json=body, timeout=self.timeout)
            elif method == 'DELETE':
                response = self.session.delete(url, timeout=self.timeout)
            else:
                raise ValueError(f'Unsupported method: {method}')
            
            response.raise_for_status()
            data = response.json()
            
            if not data.get('success'):
                error = data.get('error', {})
                raise Exception(error.get('message', 'API request failed'))
            
            return data.get('data')
            
        except requests.exceptions.RequestException as e:
            raise Exception(f'Request failed: {str(e)}')
    
    def create_fnol(self, fnol_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create FNOL submission
        
        Args:
            fnol_data: FNOL data dictionary
            
        Returns:
            FNOL result
        """
        return self._request('fnol/create', 'POST', fnol_data)
    
    def check_deadlines(self, state: str, carrier: Optional[str] = None, claim_type: Optional[str] = None, date_of_loss: Optional[str] = None) -> Dict[str, Any]:
        """
        Check deadlines
        
        Args:
            state: State code
            carrier: Carrier name (optional)
            claim_type: Claim type (optional)
            date_of_loss: Date of loss (optional)
            
        Returns:
            Deadlines result
        """
        params = {'state': state}
        if carrier:
            params['carrier'] = carrier
        if claim_type:
            params['claimType'] = claim_type
        if date_of_loss:
            params['dateOfLoss'] = date_of_loss
        
        return self._request('deadlines/check', 'POST', params)
    
    def analyze_compliance(self, state: str, carrier: str, claim_type: str, events: Optional[list] = None) -> Dict[str, Any]:
        """
        Analyze compliance
        
        Args:
            state: State code
            carrier: Carrier name
            claim_type: Claim type
            events: List of events (optional)
            
        Returns:
            Compliance analysis
        """
        params = {
            'state': state,
            'carrier': carrier,
            'claimType': claim_type,
            'events': events or []
        }
        return self._request('compliance/analyze', 'POST', params)
    
    def upload_evidence(self, file_url: str, file_name: str, file_size: Optional[int] = None, mime_type: Optional[str] = None, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload evidence
        
        Args:
            file_url: File URL
            file_name: File name
            file_size: File size in bytes (optional)
            mime_type: MIME type (optional)
            category: Category (optional)
            
        Returns:
            Evidence upload result
        """
        params = {
            'file_url': file_url,
            'file_name': file_name
        }
        if file_size:
            params['file_size'] = file_size
        if mime_type:
            params['mime_type'] = mime_type
        if category:
            params['category'] = category
        
        return self._request('evidence/upload', 'POST', params)
    
    def interpret_estimate(self, file_url: str, loss_type: Optional[str] = None, severity: Optional[str] = None, areas: Optional[list] = None) -> Dict[str, Any]:
        """
        Interpret contractor estimate
        
        Args:
            file_url: Estimate file URL
            loss_type: Loss type (optional)
            severity: Severity (optional)
            areas: Affected areas (optional)
            
        Returns:
            Estimate interpretation
        """
        params = {'file_url': file_url}
        if loss_type:
            params['loss_type'] = loss_type
        if severity:
            params['severity'] = severity
        if areas:
            params['areas'] = areas
        
        return self._request('estimate/interpret', 'POST', params)
    
    def calculate_settlement(self, initial_offer: float, estimated_damage: Optional[float] = None, policy_limits: Optional[float] = None, deductible: Optional[float] = None) -> Dict[str, Any]:
        """
        Calculate settlement
        
        Args:
            initial_offer: Initial settlement offer
            estimated_damage: Estimated damage (optional)
            policy_limits: Policy limits (optional)
            deductible: Deductible (optional)
            
        Returns:
            Settlement calculation
        """
        params = {'initial_offer': initial_offer}
        if estimated_damage:
            params['estimated_damage'] = estimated_damage
        if policy_limits:
            params['policy_limits'] = policy_limits
        if deductible:
            params['deductible'] = deductible
        
        return self._request('settlement/calc', 'POST', params)
    
    def compare_policies(self, policy_a_url: str, policy_b_url: str) -> Dict[str, Any]:
        """
        Compare policies
        
        Args:
            policy_a_url: First policy URL
            policy_b_url: Second policy URL
            
        Returns:
            Policy comparison
        """
        params = {
            'policy_a_url': policy_a_url,
            'policy_b_url': policy_b_url
        }
        return self._request('policy/compare', 'POST', params)
    
    def list_alerts(self, resolved: Optional[bool] = None, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """
        List alerts
        
        Args:
            resolved: Filter by resolved status (optional)
            limit: Result limit
            offset: Result offset
            
        Returns:
            Alerts list
        """
        params = {'limit': limit, 'offset': offset}
        if resolved is not None:
            params['resolved'] = resolved
        
        query_string = urlencode(params)
        return self._request(f'alerts/list?{query_string}', 'GET')
    
    def resolve_alert(self, alert_id: str) -> Dict[str, Any]:
        """
        Resolve alert
        
        Args:
            alert_id: Alert ID
            
        Returns:
            Resolved alert
        """
        return self._request('alerts/resolve', 'POST', {'alert_id': alert_id})
    
    def query_history(self, carrier: Optional[str] = None, state: Optional[str] = None, claim_type: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
        """
        Query settlement history
        
        Args:
            carrier: Carrier filter (optional)
            state: State filter (optional)
            claim_type: Claim type filter (optional)
            limit: Result limit
            
        Returns:
            Settlement history
        """
        params = {'limit': limit}
        if carrier:
            params['carrier'] = carrier
        if state:
            params['state'] = state
        if claim_type:
            params['claim_type'] = claim_type
        
        query_string = urlencode(params)
        return self._request(f'history/query?{query_string}', 'GET')
    
    def find_expert(self, specialty: Optional[str] = None, state: Optional[str] = None, min_experience: Optional[int] = None, name_search: Optional[str] = None) -> Dict[str, Any]:
        """
        Find expert witnesses
        
        Args:
            specialty: Specialty filter (optional)
            state: State filter (optional)
            min_experience: Minimum experience years (optional)
            name_search: Name search term (optional)
            
        Returns:
            Expert witnesses
        """
        params = {}
        if specialty:
            params['specialty'] = specialty
        if state:
            params['state'] = state
        if min_experience:
            params['min_experience'] = min_experience
        if name_search:
            params['name_search'] = name_search
        
        query_string = urlencode(params) if params else ''
        endpoint = f'expert/find?{query_string}' if query_string else 'expert/find'
        return self._request(endpoint, 'GET')
    
    def generate_checklist(self, claim_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate checklist
        
        Args:
            claim_id: Claim ID (optional)
            
        Returns:
            Checklist tasks
        """
        params = {}
        if claim_id:
            params['claim_id'] = claim_id
        
        return self._request('checklist/generate', 'POST', params)


