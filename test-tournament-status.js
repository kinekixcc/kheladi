// Test script to check tournament status
// Run this in the browser console on the admin dashboard

console.log('🔍 Checking tournament status...');

// Check if we can access the database
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client found');
  
  // Test query to get all tournaments
  window.supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Database query error:', error);
        return;
      }
      
      console.log('📊 Tournaments found:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.table(data.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          requires_approval: t.requires_approval,
          created_at: t.created_at,
          organizer: t.organizer_name
        })));
        
        const pendingCount = data.filter(t => t.status === 'pending_approval').length;
        const activeCount = data.filter(t => t.status === 'active').length;
        const approvedCount = data.filter(t => t.status === 'approved').length;
        
        console.log('📈 Status Summary:');
        console.log(`- Pending Approval: ${pendingCount}`);
        console.log(`- Active: ${activeCount}`);
        console.log(`- Approved: ${approvedCount}`);
        console.log(`- Total: ${data.length}`);
      }
    });
} else {
  console.log('❌ Supabase client not found');
  console.log('Available globals:', Object.keys(window).filter(k => k.includes('supabase')));
}



