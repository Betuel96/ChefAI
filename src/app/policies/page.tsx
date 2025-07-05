// src/app/policies/page.tsx
export default function PoliciesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Políticas de ChefAI</h1>
        <p className="text-muted-foreground mt-2 text-lg">Última actualización: [Fecha]</p>
      </header>
      
      <section id="terms-of-service">
        <h2 className="font-headline text-3xl font-bold mb-4">Términos de Servicio</h2>
        <div className="space-y-4 text-muted-foreground">
            <p className="font-bold text-destructive">AVISO IMPORTANTE: Este es un texto de marcador de posición. No constituye asesoramiento legal. Debes consultar con un profesional legal para redactar tus propios términos de servicio.</p>
            <p>Bienvenido a ChefAI. Al usar nuestra aplicación, aceptas estar sujeto a estos términos. Si no estás de acuerdo, no uses la aplicación.</p>
            <h3 className="font-semibold text-foreground text-xl pt-4">1. Uso de la Cuenta</h3>
            <p>Eres responsable de mantener la seguridad de tu cuenta y de todas las actividades que ocurran bajo la misma. Debes notificarnos inmediatamente sobre cualquier uso no autorizado.</p>
            <h3 className="font-semibold text-foreground text-xl pt-4">2. Contenido del Usuario</h3>
            <p>Tú retienes la propiedad de todo el contenido que publicas. Sin embargo, al publicar, nos otorgas una licencia mundial, no exclusiva y libre de regalías para usar, reproducir y distribuir tu contenido en relación con el funcionamiento de la aplicación.</p>
            <h3 className="font-semibold text-foreground text-xl pt-4">3. Terminación</h3>
            <p>Nos reservamos el derecho de suspender o terminar tu cuenta en cualquier momento, sin previo aviso, por cualquier motivo, incluyendo la violación de estos términos.</p>
        </div>
      </section>

      <section id="subscription-policy">
        <h2 className="font-headline text-3xl font-bold mb-4">Política de Suscripción</h2>
         <div className="space-y-4 text-muted-foreground">
            <p>Nuestras suscripciones "Pro" y "Voice+" se facturan de forma recurrente (mensual). Tu suscripción se renovará automáticamente al final de cada período de facturación a menos que la canceles.</p>
            <h3 className="font-semibold text-foreground text-xl pt-4">1. Cancelaciones y Reembolsos</h3>
            <p>Puedes cancelar tu suscripción en cualquier momento desde la página de configuración. La cancelación entrará en vigor al final de tu período de facturación actual. No se ofrecen reembolsos por períodos de suscripción parciales.</p>
        </div>
      </section>

      <section id="monetization-policy">
        <h2 className="font-headline text-3xl font-bold mb-4">Política de Monetización para Creadores</h2>
        <div className="space-y-4 text-muted-foreground">
            <p>Los creadores pueden ganar dinero a través de propinas de otros usuarios. Para ello, deben conectar una cuenta de Stripe Express.</p>
            <h3 className="font-semibold text-foreground text-xl pt-4">1. Tarifas de la Plataforma</h3>
            <p>ChefAI cobra una tarifa de plataforma del 25% sobre todas las propinas recibidas por los creadores. Por ejemplo, de una propina de $2.00, la plataforma retiene $0.50 y el creador recibe $1.50, menos las tarifas de procesamiento de Stripe.</p>
            <h3 className="font-semibold text-foreground text-xl pt-4">2. Pagos</h3>
            <p>Los pagos se procesan a través de Stripe y están sujetos a sus términos y condiciones. ChefAI no es responsable de la retención o pago de impuestos en tu nombre.</p>
        </div>
      </section>

       <section id="privacy-policy">
        <h2 className="font-headline text-3xl font-bold mb-4">Política de Privacidad</h2>
         <div className="space-y-4 text-muted-foreground">
            <p className="font-bold text-destructive">AVISO IMPORTANTE: Este es un texto de marcador de posición. Debes redactar una política de privacidad que cumpla con las leyes aplicables como GDPR y CCPA.</p>
            <p>Recopilamos la información que nos proporcionas directamente, como cuando creas una cuenta. También recopilamos información automáticamente, como tu dirección IP. Usamos esta información para operar y mejorar nuestros servicios.</p>
        </div>
      </section>

    </div>
  );
}