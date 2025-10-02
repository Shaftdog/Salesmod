
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>New Client</CardTitle>
                    <CardDescription>
                        Fill out the form below to add a new client. Fields marked with <span className="text-destructive">*</span> are required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ClientForm />
                </CardContent>
            </Card>
        </div>
    );
}
